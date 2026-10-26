import ExpoModulesCore
import Foundation
import Metal
import SceneKit
import UIKit
import WidgetKit

private let appGroup = "group.app.v1ce"
private let widgetKind = "V1CEWidget"

private struct CoinRequest: Codable {
  let displayName: String
  let milestone: String
  let coinMotto: String
  let selections: [String]
  let color: String
  let numberStyle: String
  let showBack: Bool
  let width: CGFloat
  let height: CGFloat
}

final class V1CECoinView: ExpoView {
  private let sceneView = SCNView()
  private var request: CoinRequest?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    sceneView.backgroundColor = .clear
    sceneView.allowsCameraControl = true
    sceneView.autoenablesDefaultLighting = true
    addSubview(sceneView)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    sceneView.frame = bounds
  }

  func update(request: CoinRequest) {
    let wasBack = self.request?.showBack ?? request.showBack
    self.request = request
    sceneView.scene = V1CECoinSceneFactory.makeScene(request: request)
    sceneView.pointOfView = V1CECoinSceneFactory.camera()
    if wasBack != request.showBack, let coin = sceneView.scene?.rootNode.childNode(withName: "v1ce_coin", recursively: true) {
      coin.eulerAngles.y = wasBack ? .pi : 0
      coin.runAction(SCNAction.rotateBy(x: 0, y: request.showBack ? .pi : -.pi, z: 0, duration: 0.52))
    }
  }
}

private enum V1CECoinSceneFactory {
  private static let masterAssetName = "v1ce_coin_master"

  static func makeScene(request: CoinRequest) -> SCNScene {
    if let master = loadMasterScene() {
      return personalizedScene(from: master, request: request)
    }
    return proceduralFallbackScene(request: request)
  }

  private static func loadMasterScene() -> SCNScene? {
    guard let url = Bundle.main.url(forResource: masterAssetName, withExtension: "obj") else { return nil }
    return try? SCNScene(url: url, options: [.checkConsistency: true])
  }

  private static func personalizedScene(from master: SCNScene, request: CoinRequest) -> SCNScene {
    let scene = master
    let coin = scene.rootNode.childNode(withName: "v1ce_coin_asset", recursively: true) ?? scene.rootNode
    coin.name = "v1ce_coin"
    coin.eulerAngles.y = request.showBack ? .pi : 0
    // Master geometry/materials remain intact. User-specific text is attached
    // as SceneKit relief so the reusable asset never stores profile data.
    addText(request.milestone, at: SCNVector3(0, -0.01, 0.12), to: coin, color: .white, size: 0.288, fontIdentifier: request.numberStyle)
    addText(request.displayName.uppercased(), at: SCNVector3(0, -0.39, 0.12), to: coin, color: .white, size: 0.207, fontIdentifier: request.numberStyle)
    addText(request.coinMotto, at: SCNVector3(0, 0.17, -0.12), to: coin, color: .white, size: 0.18, fontIdentifier: request.numberStyle)
    addText("FREE FROM", at: SCNVector3(0, -0.08, -0.12), to: coin, color: .white, size: 0.105, fontIdentifier: request.numberStyle)
    for (index, value) in request.selections.prefix(3).enumerated() {
      addText(value.uppercased(), at: SCNVector3(0, -0.25 - Float(index) * 0.115, -0.12), to: coin, color: .white, size: 0.095, fontIdentifier: request.numberStyle)
    }
    return scene
  }

  private static func proceduralFallbackScene(request: CoinRequest) -> SCNScene {
    let scene = SCNScene()
    let root = scene.rootNode
    let color = UIColor(hex: request.color)
    let relief = UIColor.white
    let coin = SCNNode()
    coin.name = "v1ce_coin"
    let body = SCNCylinder(radius: 1, height: 0.18)
    body.radialSegmentCount = 128
    body.firstMaterial = material(color, metallic: 0.8)
    coin.geometry = body
    root.addChildNode(coin)

    let rim = SCNTorus(ringRadius: 0.87, pipeRadius: 0.075)
    rim.radialSegmentCount = 128
    rim.firstMaterial = material(.white, metallic: 0.7)
    let rimNode = SCNNode(geometry: rim)
    rimNode.position.z = 0.105
    coin.addChildNode(rimNode)

    if let logoPath = Bundle.main.path(forResource: "v1ce-wordmark-approved", ofType: "png"), let logo = UIImage(contentsOfFile: logoPath) {
      let plane = SCNPlane(width: 0.52, height: 0.52 * 187 / 279)
      plane.firstMaterial = imageMaterial(logo)
      let node = SCNNode(geometry: plane)
      node.position = SCNVector3(0, 0.42, 0.115)
      coin.addChildNode(node)
    }
    addText(request.milestone, at: SCNVector3(0, -0.01, 0.12), to: coin, color: relief, size: 0.288, fontIdentifier: request.numberStyle)
    addText(request.displayName.uppercased(), at: SCNVector3(0, -0.39, 0.12), to: coin, color: relief, size: 0.207, fontIdentifier: request.numberStyle)

    let back = SCNNode()
    back.eulerAngles.y = .pi
    addText(request.coinMotto, at: SCNVector3(0, 0.17, -0.12), to: back, color: relief, size: 0.18, fontIdentifier: request.numberStyle)
    addText("FREE FROM", at: SCNVector3(0, -0.08, -0.12), to: back, color: relief, size: 0.105, fontIdentifier: request.numberStyle)
    for (index, value) in request.selections.prefix(3).enumerated() {
      addText(value.uppercased(), at: SCNVector3(0, -0.25 - Float(index) * 0.115, -0.12), to: back, color: relief, size: 0.095, fontIdentifier: request.numberStyle)
    }
    coin.addChildNode(back)
    return scene
  }

  static func camera() -> SCNNode {
    let node = SCNNode()
    let camera = SCNCamera()
    camera.fieldOfView = 32
    node.camera = camera
    node.position = SCNVector3(0, 0, 5.2)
    node.look(at: SCNVector3(0, 0, 0))
    return node
  }

  static func render(request: CoinRequest) -> UIImage? {
    let renderer = SCNRenderer(device: MTLCreateSystemDefaultDevice())
    renderer.scene = makeScene(request: request)
    renderer.pointOfView = camera()
    return renderer.snapshot(atTime: 0, with: CGSize(width: request.width, height: request.height), antialiasingMode: .multisampling4X)
  }

  private static func addText(_ value: String, at position: SCNVector3, to parent: SCNNode, color: UIColor, size: CGFloat, fontIdentifier: String) {
    guard !value.isEmpty else { return }
    let text = SCNText(string: String(value.prefix(90)), extrusionDepth: 0.025)
    text.font = UIFont(name: iosFontName(for: fontIdentifier), size: size) ?? UIFont.systemFont(ofSize: size)
    text.flatness = 0.12
    text.firstMaterial = material(color, metallic: 0.45)
    let node = SCNNode(geometry: text)
    let (min, max) = text.boundingBox
    node.pivot = SCNMatrix4MakeTranslation((min.x + max.x) / 2, (min.y + max.y) / 2, 0)
    node.position = position
    node.scale = SCNVector3(0.72, 0.72, 0.72)
    parent.addChildNode(node)
  }

  private static func iosFontName(for identifier: String) -> String {
    let names: [String: String] = [
      "walter_turncoat": "WalterTurncoat-Regular",
      "vt323": "VT323-Regular",
      "im_fell_english_sc": "IMFellEnglishSC-Regular",
      "slackey": "Slackey-Regular",
      "josefin_sans": "JosefinSans-Bold",
      "varela_round": "VarelaRound-Regular"
    ]
    return names[identifier] ?? names["walter_turncoat"]!
  }

  private static func material(_ color: UIColor, metallic: CGFloat) -> SCNMaterial {
    let material = SCNMaterial()
    material.diffuse.contents = color
    material.metalness.contents = metallic
    material.roughness.contents = 0.28
    return material
  }

  private static func imageMaterial(_ image: UIImage) -> SCNMaterial {
    let material = SCNMaterial()
    material.diffuse.contents = image
    material.isDoubleSided = true
    material.transparencyMode = .aOne
    return material
  }
}

public class V1CECoinRendererModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V1CECoinRenderer")

    View(V1CECoinView.self) {
      Prop("requestJSON") { (view: V1CECoinView, json: String) in
        guard let data = json.data(using: .utf8), let request = try? JSONDecoder().decode(CoinRequest.self, from: data) else { return }
        view.update(request: request)
      }
    }

    Function("renderSnapshot") { (json: String) -> String in
      guard let data = json.data(using: .utf8), let request = try? JSONDecoder().decode(CoinRequest.self, from: data), let image = V1CECoinSceneFactory.render(request: request), let png = image.pngData(), let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return "" }
      let face = request.showBack ? "back" : "front"
      let destination = container.appendingPathComponent("v1ce-coin-3d-\(face).png")
      let temporary = container.appendingPathComponent(".v1ce-coin-3d-\(face)-\(UUID().uuidString).tmp")
      do {
        try png.write(to: temporary, options: .atomic)
        _ = try FileManager.default.replaceItemAt(destination, withItemAt: temporary)
      } catch {
        try? png.write(to: destination, options: .atomic)
      }
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
      return destination.path
    }

    Function("clearSnapshots") {
      guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return }
      for face in ["front", "back"] { try? FileManager.default.removeItem(at: container.appendingPathComponent("v1ce-coin-3d-\(face).png")) }
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }
  }
}

private extension UIColor {
  convenience init(hex: String) {
    let named: [String: String] = ["gold": "F5D680", "silver": "E0E0E0", "bronze": "CD7F32", "midnight": "0A0A0A"]
    let raw = (named[hex] ?? hex).replacingOccurrences(of: "#", with: "")
    let value = UInt64(raw, radix: 16) ?? 0xF5D680
    self.init(red: CGFloat((value >> 16) & 255) / 255, green: CGFloat((value >> 8) & 255) / 255, blue: CGFloat(value & 255) / 255, alpha: 1)
  }
}
