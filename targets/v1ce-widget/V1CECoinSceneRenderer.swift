import Foundation
import Metal
import SceneKit
import UIKit

/// Profile payload consumed by the reusable native coin renderer.
/// `coinMotto` is intentionally separate from the app's `personal_quote`.
struct V1CECoinProfile {
  let displayName: String
  let milestone: String
  let coinMotto: String
  let wordmark: UIImage
  let coinColor: UIColor
  let reliefColor: UIColor
}

/// Incremental 3D renderer. The existing SwiftUI Canvas renderer remains the
/// widget fallback until this renderer is wired into the generated target and
/// verified on iOS. The same scene can drive a live SCNView in the app and an
/// off-screen PNG snapshot for WidgetKit.
final class V1CECoinSceneRenderer {
  let scene: SCNScene
  private let profile: V1CECoinProfile

  init(profile: V1CECoinProfile) {
    self.profile = profile
    self.scene = SCNScene()
    buildScene()
  }

  func liveView(frame: CGRect) -> SCNView {
    let view = SCNView(frame: frame)
    view.scene = scene
    view.allowsCameraControl = true
    view.autoenablesDefaultLighting = true
    view.backgroundColor = .clear
    return view
  }

  func snapshot(size: CGSize, showsBack: Bool = false) -> UIImage? {
    let renderer = SCNRenderer(device: MTLCreateSystemDefaultDevice())
    renderer.scene = scene
    renderer.scene?.rootNode.childNode(withName: "coin", recursively: true)?.eulerAngles.y = showsBack ? .pi : 0
    renderer.pointOfView = cameraNode
    renderer.sceneTime = 0
    return renderer.snapshot(atTime: 0, with: size, antialiasingMode: .multisampling4X)
  }

  private var cameraNode: SCNNode {
    let camera = SCNCamera()
    camera.fieldOfView = 32
    let node = SCNNode()
    node.camera = camera
    node.position = SCNVector3(0, 0, 5.2)
    node.look(at: SCNVector3(0, 0, 0))
    return node
  }

  private func buildScene() {
    let root = scene.rootNode
    let coin = SCNNode()
    coin.name = "coin"
    let body = SCNCylinder(radius: 1.0, height: 0.18)
    body.radialSegmentCount = 96
    body.firstMaterial = material(profile.coinColor, metallic: 0.8)
    coin.geometry = body
    root.addChildNode(coin)

    let rim = SCNTorus(ringRadius: 0.87, pipeRadius: 0.075)
    rim.radialSegmentCount = 96
    rim.firstMaterial = material(profile.reliefColor, metallic: 0.7)
    let rimNode = SCNNode(geometry: rim)
    rimNode.position.z = 0.105
    coin.addChildNode(rimNode)

    // The approved PNG remains the branding source. It is placed as a face
    // material instead of replacing the wordmark with typed text.
    let front = SCNPlane(width: 1.15, height: 0.28)
    front.firstMaterial = imageMaterial(profile.wordmark)
    let frontNode = SCNNode(geometry: front)
    frontNode.position = SCNVector3(0, 0.50, 0.11)
    frontNode.eulerAngles.x = -.pi / 2
    coin.addChildNode(frontNode)

    addRelief(profile.milestone, y: 0.06, z: 0.115, to: coin)
    addRelief(profile.displayName.uppercased(), y: -0.30, z: 0.115, to: coin)

    let back = SCNNode()
    back.name = "back"
    addRelief(profile.coinMotto, y: 0.0, z: -0.115, to: back)
    back.position = SCNVector3(0, 0, 0)
    back.eulerAngles.y = .pi
    coin.addChildNode(back)
    root.addChildNode(cameraNode)
  }

  private func addRelief(_ value: String, y: Float, z: Float, to parent: SCNNode) {
    guard !value.isEmpty else { return }
    let text = SCNText(string: String(value.prefix(90)), extrusionDepth: 0.025)
    text.flatness = 0.12
    text.font = UIFont(name: "WalterTurncoat-Regular", size: 0.22) ?? UIFont.systemFont(ofSize: 0.22)
    text.firstMaterial = material(profile.reliefColor, metallic: 0.45)
    let node = SCNNode(geometry: text)
    let (min, max) = text.boundingBox
    node.pivot = SCNMatrix4MakeTranslation((min.x + max.x) / 2, (min.y + max.y) / 2, 0)
    node.position = SCNVector3(0, y, z)
    node.scale = SCNVector3(0.72, 0.72, 0.72)
    parent.addChildNode(node)
  }

  private func material(_ color: UIColor, metallic: CGFloat) -> SCNMaterial {
    let material = SCNMaterial()
    material.diffuse.contents = color
    material.metalness.contents = metallic
    material.roughness.contents = 0.28
    return material
  }

  private func imageMaterial(_ image: UIImage) -> SCNMaterial {
    let material = SCNMaterial()
    material.diffuse.contents = image
    material.isDoubleSided = true
    material.transparencyMode = .aOne
    return material
  }
}
