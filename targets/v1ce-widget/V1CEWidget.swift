import SwiftUI
import WidgetKit
import Foundation
import CoreText
import ImageIO
import UIKit

private let group = "group.app.v1ce"
private let readyKey = "v1ce_widget_ready"
private let sobrietyDateKey = "v1ce_widget_sobriety_date"
private let displayNameKey = "v1ce_widget_display_name"
private let coinColorKey = "v1ce_widget_coin_color"
private let coinShapeKey = "v1ce_widget_coin_shape"
private let coinShapePathKey = "v1ce_widget_coin_shape_path"
private let numberStyleKey = "v1ce_widget_number_style"
private let coinShowBorderKey = "v1ce_widget_coin_show_border"
private let coinBorderColorKey = "v1ce_widget_coin_border_color"
private let coinNumberColorKey = "v1ce_widget_coin_number_color"
private let coinMottoKey = "v1ce_widget_coin_motto"
private let coinBackIconKey = "v1ce_widget_coin_back_icon"
private let isPremiumKey = "v1ce_widget_is_premium"
private let personalQuoteKey = "v1ce_widget_personal_quote"
private let selectedFriendsKey = "v1ce_widget_selected_friends"

private func sharedPhoto(_ name: String?) -> UIImage? {
  guard let name = name,
    name.range(of: "^v1ce-coin-photo-[a-z0-9-]+\\.img$", options: .regularExpression) != nil,
    let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group),
    let source = CGImageSourceCreateWithURL(directory.appendingPathComponent(name) as CFURL, nil) else { return nil }
  let options: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 512, kCGImageSourceCreateThumbnailWithTransform: true]
  guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
  return UIImage(cgImage: image)
}

private func sharedCoin3DSnapshot(showBack: Bool) -> UIImage? {
  guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) else { return nil }
  let file = directory.appendingPathComponent("v1ce-coin-3d-\(showBack ? "back" : "front").png")
  guard let source = CGImageSourceCreateWithURL(file as CFURL, nil), let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { return nil }
  return UIImage(cgImage: image)
}

private struct FriendAvatar: View {
  let friend: WidgetFriend?
  private var asset: String {
    let keys = ["MIA", "CROSS", "LEAF", "JORDAN", "PINK", "DOTS", "TAYLOR", "CASEY"]
    let seed = friend?.avatarSeed ?? friend?.name ?? "MIA"
    if keys.contains(seed.uppercased()) { return "Avatar-" + seed.uppercased() }
    // Match the app's first UTF-16 code unit for each Unicode code point.
    let sum = seed.unicodeScalars.reduce(0) { total, scalar in
      total + (scalar.value > 0xFFFF ? Int(0xD800 + ((scalar.value - 0x10000) >> 10)) : Int(scalar.value))
    }
    return "Avatar-" + keys[sum % keys.count]
  }
  var body: some View {
    Group {
      if let photo = sharedPhoto(friend?.photoFile) {
        Image(uiImage: photo).resizable().scaledToFill()
      } else {
        Image(asset).resizable().scaledToFill()
      }
    }.clipShape(Circle())
  }
}

private struct WidgetFriend: Decodable, Identifiable {
  let id: String
  let name: String
  let avatar: String
  let sobrietyDate: String?
  let avatarSeed: String?
  let photoFile: String?
}

private func selectedFriends() -> [WidgetFriend] {
  guard let json = UserDefaults(suiteName: group)?.string(forKey: selectedFriendsKey),
        let data = json.data(using: .utf8) else { return [] }
  let decoded = (try? JSONDecoder().decode([WidgetFriend].self, from: data)) ?? []
  return Array(decoded.prefix(3))
}

struct Snapshot: Codable {
  let sobrietyDate: String
  let displayName: String
  let coinColor: String
  let coinShape: String
  let coinShapePath: String?
  let numberStyle: String
  let coinShowBorder: Bool
  let coinBorderColor: String?
  let coinNumberColor: String?
  let coinMotto: String
  let coinBackIcon: String
  let isPremium: Bool
  let personalQuote: String
  var coinDesign: SharedCoinDesign? = nil

  init(
    sobrietyDate: String,
    displayName: String,
    coinColor: String,
    coinShape: String,
    coinShapePath: String?,
    numberStyle: String,
    coinShowBorder: Bool,
    coinBorderColor: String?,
    coinNumberColor: String?,
    coinMotto: String,
    coinBackIcon: String,
    isPremium: Bool,
    personalQuote: String
  ) {
    self.sobrietyDate = sobrietyDate
    self.displayName = displayName
    self.coinColor = coinColor
    self.coinShape = coinShape
    self.coinShapePath = coinShapePath
    self.numberStyle = numberStyle
    self.coinShowBorder = coinShowBorder
    self.coinBorderColor = coinBorderColor
    self.coinNumberColor = coinNumberColor
    self.coinMotto = coinMotto
    self.coinBackIcon = coinBackIcon
    self.isPremium = isPremium
    self.personalQuote = personalQuote
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    sobrietyDate = try c.decode(String.self, forKey: .sobrietyDate)
    displayName = try c.decodeIfPresent(String.self, forKey: .displayName) ?? ""
    coinColor = try c.decodeIfPresent(String.self, forKey: .coinColor) ?? "#F5D680"
    coinShape = try c.decodeIfPresent(String.self, forKey: .coinShape) ?? "circle"
    coinShapePath = try c.decodeIfPresent(String.self, forKey: .coinShapePath)
    numberStyle = try c.decodeIfPresent(String.self, forKey: .numberStyle) ?? "walter_turncoat"
    coinShowBorder = try c.decodeIfPresent(Bool.self, forKey: .coinShowBorder) ?? true
    coinBorderColor = try c.decodeIfPresent(String.self, forKey: .coinBorderColor)
    coinNumberColor = try c.decodeIfPresent(String.self, forKey: .coinNumberColor)
    coinMotto = try c.decodeIfPresent(String.self, forKey: .coinMotto) ?? ""
    coinBackIcon = try c.decodeIfPresent(String.self, forKey: .coinBackIcon) ?? "none"
    isPremium = try c.decodeIfPresent(Bool.self, forKey: .isPremium) ?? false
    personalQuote = try c.decodeIfPresent(String.self, forKey: .personalQuote) ?? ""
    coinDesign = try c.decodeIfPresent(SharedCoinDesign.self, forKey: .coinDesign)
  }
}

private func snap() -> Snapshot? {
  guard let defaults = UserDefaults(suiteName: group) else { return nil }

  if let json = defaults.string(forKey: "v1ce_widget_coin_design_v2"),
     let bytes = json.data(using: .utf8), bytes.count < 150_000,
     let snapshot = try? JSONDecoder().decode(Snapshot.self, from: bytes),
     snapshot.coinDesign?.version == 2 {
    return snapshot
  }

  if defaults.integer(forKey: readyKey) == 1,
     let sobrietyDate = defaults.string(forKey: sobrietyDateKey),
     !sobrietyDate.isEmpty {
    return Snapshot(
      sobrietyDate: sobrietyDate,
      displayName: defaults.string(forKey: displayNameKey) ?? "",
      coinColor: defaults.string(forKey: coinColorKey) ?? "#F5D680",
      coinShape: defaults.string(forKey: coinShapeKey) ?? "circle",
      coinShapePath: defaults.string(forKey: coinShapePathKey),
      numberStyle: defaults.string(forKey: numberStyleKey) ?? "walter_turncoat",
      coinShowBorder: defaults.integer(forKey: coinShowBorderKey) != 0,
      coinBorderColor: defaults.string(forKey: coinBorderColorKey),
      coinNumberColor: defaults.string(forKey: coinNumberColorKey),
      coinMotto: defaults.string(forKey: coinMottoKey) ?? "",
      coinBackIcon: defaults.string(forKey: coinBackIconKey) ?? "none",
      isPremium: defaults.integer(forKey: isPremiumKey) != 0,
      personalQuote: defaults.string(forKey: personalQuoteKey) ?? ""
    )
  }

  if let data = defaults.data(forKey: "v1ce_widget_profile_v1") {
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }
  if let string = defaults.string(forKey: "v1ce_widget_profile_v1"), let data = string.data(using: .utf8) {
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }
  return nil
}

private func days(_ s: String, _ now: Date) -> Int {
  let f = DateFormatter()
  f.dateFormat = "yyyy-MM-dd"
  f.timeZone = .current
  guard let x = f.date(from: String(s.prefix(10))) else { return 0 }
  return max(0, Calendar.current.dateComponents([.day],
    from: Calendar.current.startOfDay(for: x),
    to: Calendar.current.startOfDay(for: now)
  ).day ?? 0)
}

private func display(_ d: Int) -> (Int, String) {
  let y = d / 365
  let m = (d % 365) / 30
  if y > 0 { return (y, y == 1 ? "YEAR" : "YEARS") }
  if m > 0 { return (m, m == 1 ? "MONTH" : "MONTHS") }
  return (d, "DAYS")
}

private func hexColor(_ h: String) -> Color {
  let named: [String: String] = [
    "gold": "#F5D680", "silver": "#E0E0E0", "bronze": "#CD7F32",
    "rose_gold": "#E8B4B8", "midnight": "#0A0A0A", "emerald": "#2E8B57"
  ]
  let raw = named[h] ?? h
  let x = raw.replacingOccurrences(of: "#", with: "")
  guard x.count == 6, let n = UInt64(x, radix: 16) else { return Color(red: 0.96, green: 0.84, blue: 0.50) }
  return Color(red: Double((n >> 16) & 255) / 255,
               green: Double((n >> 8) & 255) / 255,
               blue: Double(n & 255) / 255)
}

private func luminance(_ color: String) -> Double {
  let named: [String: String] = [
    "gold": "#F5D680", "silver": "#E0E0E0", "bronze": "#CD7F32",
    "rose_gold": "#E8B4B8", "midnight": "#0A0A0A", "emerald": "#2E8B57"
  ]
  let raw = (named[color] ?? color).replacingOccurrences(of: "#", with: "")
  guard raw.count == 6, let n = UInt64(raw, radix: 16) else { return 0.8 }
  let r = Double((n >> 16) & 255), g = Double((n >> 8) & 255), b = Double(n & 255)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

private func autoContrast(_ color: String) -> Color {
  luminance(color) > 0.6 ? .black : luminance(color) > 0.5 ? Color(red: 0.04, green: 0.04, blue: 0.04) : .white
}

private func customColor(_ value: String?, fallback: Color) -> Color {
  guard let value, !value.isEmpty else { return fallback }
  return hexColor(value)
}

private let fontNames: [String: String] = [
  "vt323": "VT323-Regular",
  "im_fell_english_sc": "IMFellEnglishSC-Regular",
  "slackey": "Slackey-Regular",
  "josefin_sans": "JosefinSans-Bold",
  "varela_round": "VarelaRound-Regular",
  "walter_turncoat": "WalterTurncoat-Regular",
  "classic": "Cinzel",
  "poppins": "Poppins",
  "monospace": "Space Mono",
  "fredoka": "Fredoka",
  "serif": "Cinzel-Bold",
  "dmsans": "DM Sans",
  "courier": "Courier Prime",
  "bodoni": "Cinzel-Bold",
  "syne": "Syne",
  "pacifico": "Pacifico",
  "bebas": "Bebas Neue",
  "inter": "Inter",
  "big_shoulders_stencil": "Big Shoulders Stencil",
  "roboto_mono": "Roboto Mono",
  "oswald": "Oswald",
  "raleway": "Raleway",
  "fraunces": "Cinzel-Bold",
  "caveat": "Caveat",
  "dyna_puff": "DynaPuff"
]

private func widgetFont(_ style: String, size: CGFloat) -> Font {
  Font.custom(fontNames[style] ?? "WalterTurncoat-Regular", size: size)
}

private func polygon(_ points: String, in rect: CGRect) -> Path {
  var p = Path()
  let pts = points.split(separator: " ").compactMap { part -> (CGFloat, CGFloat)? in
    let pair = part.split(separator: ",")
    guard pair.count == 2, let x = Double(pair[0]), let y = Double(pair[1]) else { return nil }
    return (CGFloat(x) / 100, CGFloat(y) / 100)
  }
  guard let first = pts.first else { return p }
  p.move(to: CGPoint(x: rect.minX + first.0 * rect.width, y: rect.minY + first.1 * rect.height))
  for point in pts.dropFirst() {
    p.addLine(to: CGPoint(x: rect.minX + point.0 * rect.width, y: rect.minY + point.1 * rect.height))
  }
  p.closeSubpath()
  return p
}

private let shapePoints: [String: String] = [
  "hexagon": "25,0 75,0 100,50 75,100 25,100 0,50",
  "octagon": "30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30",
  "shield": "50,0 100,15 100,65 50,100 0,65 0,15",
  "diamond": "50,0 95,50 50,100 5,50",
  "star": "50,2 68,27 98,35 80,59 79,94 50,80 21,94 20,59 2,35 32,27",
  "badge": "50,0 65,10 82,5 90,20 100,30 95,50 100,70 90,80 82,95 65,90 50,100 35,90 18,95 10,80 0,70 5,50 0,30 10,20 18,5 35,10",
  "arrow": "0,35 55,35 55,10 100,50 55,90 55,65 0,65"
]

private extension View {
  @ViewBuilder
  func v1ceWidgetBackground(_ background: Color) -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) { background }
    } else {
      self.background(background)
    }
  }
}

private struct CoinShape: Shape {
  let name: String
  let custom: String?

  func path(in rect: CGRect) -> Path {
    if name == "circle" || name == "cross" { return Path(ellipseIn: rect) }
    if name == "drawn", let custom { return polygon(custom, in: rect) }
    return polygon(shapePoints[name] ?? shapePoints["hexagon"]!, in: rect)
  }
}

private func registerWidgetFonts() {
  let names = [
    "VT323", "IMFellEnglishSC", "Slackey", "JosefinSans", "VarelaRound", "WalterTurncoat",
    "BigShouldersStencilDisplay-Regular",
    "Cinzel", "Poppins", "SpaceMono", "Fredoka", "IBMPlexSerif", "DMSans",
    "CourierPrime", "BodoniModa", "Syne", "Pacifico", "BebasNeue", "Inter",
    "RobotoMono", "Oswald", "Raleway", "Fraunces", "Caveat", "DynaPuff"
  ]
  for name in names {
    guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { continue }
    CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
  }
}


struct SharedPoint: Codable { let x: Double; let y: Double }
struct SharedArtwork: Codable {
  let points: [SharedPoint]; let fill: String; let stroke: String
  let width: Double; let opacity: Double; let closed: Bool
}
struct SharedTextBox: Codable, Identifiable {
  let id: String; let text: String; let x: Double; let y: Double
  let width: Double; let height: Double; let fontSize: Double; let lines: Int?
}
struct SharedCoinDesign: Codable {
  let version: Int; let polygon: [SharedPoint]; let rim: [[SharedPoint]]
  let face: String; let rimPrimary: String; let rimSecondary: String
  let shadow: String; let highlight: String; let text: String
  let showBorder: Bool; let nativeFont: String; let tracking: Double
  let front: [SharedTextBox]; let back: [SharedTextBox]
  let photo: String?; let imageOnly: Bool; let background: String; let backIcon: String
  let backgroundArt: [SharedArtwork]?; let backArt: [SharedArtwork]?
  let photoFile: String?
}
private struct SharedCoinView: View {
  let design: SharedCoinDesign
  let value: (Int, String)
  let showBack: Bool

  private func cachedPhoto() -> UIImage? { sharedPhoto(design.photoFile) }

  private func path(_ points: [SharedPoint], _ unit: CGFloat, _ origin: CGPoint, _ dy: CGFloat = 0, closed: Bool = true) -> Path {
    Path { p in
      for (index, point) in points.enumerated() {
        let next = CGPoint(x: origin.x + CGFloat(point.x) * unit, y: origin.y + (CGFloat(point.y) + dy) * unit)
        if index == 0 { p.move(to: next) } else { p.addLine(to: next) }
      }
      if closed { p.closeSubpath() }
    }
  }

  private func drawArt(_ items: [SharedArtwork], context: inout GraphicsContext, unit: CGFloat, origin: CGPoint) {
    for item in items {
      let outline = path(item.points, unit, origin, closed: item.closed)
      if !item.fill.isEmpty { context.fill(outline, with: .color(hexColor(item.fill).opacity(item.opacity))) }
      if !item.stroke.isEmpty { context.stroke(outline, with: .color(hexColor(item.stroke).opacity(item.opacity)), style: StrokeStyle(lineWidth: CGFloat(item.width) * unit, lineCap: .round, lineJoin: .round)) }
    }
  }

  var body: some View {
    let photo = cachedPhoto()
    let face = showBack ? "back" : "front"
    Canvas { context, size in
      let unit = min(size.width, size.height) / 111
      let origin = CGPoint(x: (size.width - 106 * unit) / 2 + 3 * unit, y: 3 * unit)
      let outline = path(design.polygon, unit, origin)
      for depth in stride(from: 5, through: 1, by: -1) {
        context.fill(path(design.polygon, unit, origin, CGFloat(depth)), with: .color(hexColor(design.shadow)))
        if design.showBorder {
          for segment in design.rim {
            context.fill(path(segment, unit, origin, CGFloat(depth)), with: .color(hexColor(design.rimPrimary)))
          }
        }
      }
      context.fill(outline, with: .color(hexColor(design.face)))
      var faceContext = context
      faceContext.clip(to: outline)
      if let photo {
        let edge = 100 * unit
        let scale = max(edge / photo.size.width, edge / photo.size.height)
        let width = photo.size.width * scale, height = photo.size.height * scale
        var photoContext = faceContext
        photoContext.opacity = design.imageOnly ? 1 : 0.35
        photoContext.draw(Image(uiImage: photo), in: CGRect(x: origin.x + (edge-width)/2, y: origin.y + (edge-height)/2, width: width, height: height))
      }
      drawArt(design.backgroundArt ?? [], context: &faceContext, unit: unit, origin: origin)
      context.fill(outline, with: .linearGradient(Gradient(colors: [.white.opacity(0.38), .clear, .black.opacity(0.18)]),
        startPoint: origin, endPoint: CGPoint(x: origin.x + 100 * unit, y: origin.y + 100 * unit)))
      if design.showBorder {
        context.stroke(outline, with: .color(hexColor(design.rimSecondary)), lineWidth: 2 * unit)
        for segment in design.rim {
          let panel = path(segment, unit, origin)
          context.fill(panel, with: .color(hexColor(design.rimPrimary)))
          context.stroke(panel, with: .color(hexColor(design.highlight).opacity(0.45)), lineWidth: 0.35 * unit)
        }
      }
      context.stroke(outline, with: .color(hexColor(design.highlight)), lineWidth: 0.6 * unit)
      if design.photo != nil && photo == nil {
        let message = Text("Open V1CE to refresh photo").font(.system(size: 6)).foregroundColor(hexColor(design.text))
        context.draw(context.resolve(message), at: CGPoint(x: size.width/2, y: size.height-5))
      }
      if !design.imageOnly {
        if showBack { drawArt(design.backArt ?? [], context: &faceContext, unit: unit, origin: origin) }
        for box in (showBack ? design.back : design.front) where box.width > 0 && box.height > 0 {
          let content = box.text == "$value" ? String(value.0) : box.text == "$unit" ? value.1 : box.text
          let target = CGFloat(box.fontSize) * unit
          let font = CTFontCreateWithName(design.nativeFont as CFString, target, nil)
          let attributes: [NSAttributedString.Key: Any] = [.font: font, .kern: target * design.tracking]
          func measure(_ string: String) -> (CGFloat, CGFloat) {
            let line = CTLineCreateWithAttributedString(NSAttributedString(string: string, attributes: attributes))
            var ascent: CGFloat = 0, descent: CGFloat = 0, leading: CGFloat = 0
            let width = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
            return (width, ascent + descent + leading)
          }
          var lines = [content]
          if (box.lines ?? 1) > 1 && measure(content).0 > CGFloat(box.width) * unit {
            let chars = Array(content)
            let spaces = chars.indices.filter { chars[$0] == " " && $0 > 0 && $0 < chars.count - 1 }
            let candidates = spaces.isEmpty ? Array(1..<max(1, chars.count)) : spaces
            var best = CGFloat.greatestFiniteMagnitude
            for split in candidates {
              let a = String(chars[..<split]).trimmingCharacters(in: .whitespaces)
              let b = String(chars[split...]).trimmingCharacters(in: .whitespaces)
              let width = max(measure(a).0, measure(b).0)
              if width < best { best = width; lines = [a,b] }
            }
          }
          let metrics = lines.map { measure($0) }
          let width = metrics.map { $0.0 }.max() ?? 1
          let lineHeight = metrics.map { $0.1 }.max() ?? 1
          let scale = min(1, CGFloat(box.width) * unit / max(width, 1), CGFloat(box.height) * unit / max(lineHeight * CGFloat(lines.count), 1))
          for (index, line) in lines.enumerated() {
            let text = Text(line).font(.custom(design.nativeFont, size: target * scale)).tracking(target * scale * design.tracking).foregroundColor(hexColor(design.text))
            let y = origin.y + CGFloat(box.y) * unit + (CGFloat(index) - CGFloat(lines.count - 1)/2) * lineHeight * scale
            context.draw(context.resolve(text), at: CGPoint(x: origin.x + CGFloat(box.x) * unit, y: y))
          }
        }
      }
    }
    .accessibilityLabel("V1CE coin, \\(value.0) \\(value.1), \\(face)")
  }
}

struct Entry: TimelineEntry {
  let date: Date
  let data: Snapshot?
  let showBack: Bool
}

struct Provider: TimelineProvider {
  func placeholder(in c: Context) -> Entry { Entry(date: .now, data: nil, showBack: false) }
  func getSnapshot(in c: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: .now, data: snap(), showBack: false))
  }
  func getTimeline(in c: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let n = Date()
    let data = snap()
    let interval: TimeInterval = 30 * 60
    let slot = Int(n.timeIntervalSince1970 / interval)
    let firstBoundary = Date(timeIntervalSince1970: Double(slot + 1) * interval)

    var entries = [Entry(date: n, data: data, showBack: slot % 2 != 0)]
    for offset in 0..<48 {
      let date = firstBoundary.addingTimeInterval(Double(offset) * interval)
      entries.append(Entry(date: date, data: data, showBack: (slot + offset + 1) % 2 != 0))
    }

    let refresh = firstBoundary.addingTimeInterval(48 * interval)
    completion(Timeline(entries: entries, policy: .after(refresh)))
  }
}

struct V1CEWidgetView: View {
  let entry: Entry
  @Environment(\.widgetFamily) var family

  var body: some View {
    let data = entry.data
    let d = data.map { days($0.sobrietyDate, entry.date) } ?? 0
    let value = display(d)
    let bgName = data?.coinColor ?? "gold"
    let bg = hexColor(bgName)
    let text = customColor(data?.coinNumberColor, fallback: autoContrast(bgName))
    let border = customColor(data?.coinBorderColor, fallback: autoContrast(bgName))
    let showBorder = data?.coinShowBorder ?? true
    let shapeName = data?.coinShape ?? "circle"
    let style = data?.numberStyle ?? "classic"

    GeometryReader { geo in
      let isSmall = family == .systemSmall
      let isMedium = family == .systemMedium
      let usableWidth = max(0, geo.size.width - (isSmall ? 8 : 20))
      let usableHeight = max(0, geo.size.height - (isSmall ? 8 : 20))
      let coinSide: CGFloat = {
        if isSmall {
          // WidgetKit supplies the content geometry after the system margin.
          // Keep the coin dominant while reserving a small safety inset for
          // bevels and shadows on the smallest supported widget.
          return min(usableWidth, usableHeight) * 0.86
        }
        if isMedium {
          // The left column owns the count and quote; the coin owns roughly
          // 90% of the usable height on the right.
          return min(usableHeight * 0.90, usableWidth * 0.52)
        }
        return max(112, min(geo.size.width * 0.58, geo.size.height * 0.48, 190))
      }()
      let numberFont = widgetFont(style, size: isSmall ? 34 : 42)
      let labelFont = widgetFont(style, size: isSmall ? 9 : 11)
      let detailFont = widgetFont(style, size: isSmall ? 7 : 9)

      let coin = Group {
        if let snapshot = sharedCoin3DSnapshot(showBack: entry.showBack) {
          Image(uiImage: snapshot).resizable().scaledToFit()
            .frame(width: coinSide, height: coinSide)
            .accessibilityLabel("V1CE personalized 3D coin")
        } else if let design = data?.coinDesign, design.version == 2 {
          SharedCoinView(design: design, value: value, showBack: entry.showBack)
            .frame(width: coinSide, height: coinSide)
        } else {
        ZStack {
        CoinShape(name: shapeName, custom: data?.coinShapePath)
          .fill(bg)
          .frame(width: coinSide, height: coinSide)
        if showBorder {
          CoinShape(name: shapeName, custom: data?.coinShapePath)
            .stroke(border, lineWidth: 2)
            .frame(width: max(0, coinSide - 10), height: max(0, coinSide - 10))
        }
        VStack(spacing: 2) {
          Text("\(value.0)")
            .font(numberFont)
            .minimumScaleFactor(0.45)
            .lineLimit(1)
          Text(value.1)
            .font(labelFont)
            .tracking(1.8)
            .lineLimit(1)
          Text((data?.coinMotto.isEmpty == false ? data?.coinMotto : nil) ?? "FREE FROM")
            .font(detailFont)
            .tracking(1.2)
            .multilineTextAlignment(.center)
            .lineLimit(2)
            .minimumScaleFactor(0.58)
          if entry.showBack, let icon = data?.coinBackIcon, icon != "none" {
            let symbol: String = {
              switch icon {
              case "mountain": return "mountain.2"
              case "palm": return "tree"
              case "smiley": return "face.smiling"
              case "clover": return "leaf"
              case "butterfly": return "butterfly"
              case "wave": return "water.waves"
              default: return ""
              }
            }()
            if !symbol.isEmpty {
              Image(systemName: symbol)
                .font(.system(size: max(8, coinSide * 0.095), weight: .light))
                .accessibilityHidden(true)
            }
          }
          if entry.showBack, let name = data?.displayName, !name.isEmpty {
            Text(String(name.prefix(20)).uppercased())
              .font(detailFont)
              .tracking(1.2)
              .lineLimit(1)
              .minimumScaleFactor(0.6)
          }
        }
        .foregroundColor(text)
        .padding(10)
        if entry.showBack && !(data?.isPremium ?? false) {
          Text("V1CE")
            .font(widgetFont(style, size: 7))
            .tracking(2)
            .foregroundColor(text.opacity(0.42))
            .frame(width: coinSide * 0.72, height: coinSide * 0.72, alignment: .top)
        }
      }

        }
      }

      Group {
        if isSmall {
          coin.frame(width: coinSide, height: coinSide)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        } else if isMedium {
          HStack(spacing: 6) {
            VStack(alignment: .leading, spacing: 4) {
              Image("V1CEWordmark")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 92, maxHeight: 18, alignment: .leading)
              Text("\(value.0) \(value.1)")
                .font(.system(size: 23, weight: .semibold, design: .rounded))
                .minimumScaleFactor(0.6)
                .lineLimit(1)
              Text("SOBRIETY")
                .font(.system(size: 10, weight: .medium))
                .tracking(2)
              ViewThatFits(in: .vertical) {
                ForEach([12.0, 11.0, 10.0, 9.0], id: \.self) { fontSize in
                  Text(data?.personalQuote.isEmpty == false ? (data?.personalQuote ?? "") : "Add a personal quote in your profile")
                    .font(.system(size: fontSize))
                    .italic()
                    .fixedSize(horizontal: false, vertical: true)
                    .foregroundStyle(.secondary)
                }
              }
              .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            coin.frame(width: coinSide, height: coinSide)
              .frame(maxHeight: .infinity, alignment: .center)
          }
          .padding(.horizontal, 8)
          .padding(.vertical, 6)
        } else if family == .systemLarge {
          let widgetFriends = selectedFriends()
          VStack(spacing: 9) {
            HStack {
              Image("V1CEWordmark")
                .resizable()
                .scaledToFit()
                .frame(width: 72, height: 18, alignment: .leading)
              Spacer()
            }
            HStack(alignment: .center, spacing: 12) {
              coin.frame(width: coinSide, height: coinSide)
              Text(data?.personalQuote.isEmpty == false ? (data?.personalQuote ?? "") : "Add a personal quote in your profile")
                .font(.system(size: 12))
                .italic()
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.leading)
                .lineLimit(4)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
            HStack(alignment: .top, spacing: 6) {
              ForEach(0..<3, id: \.self) { index in
                VStack(spacing: 4) {
                  FriendAvatar(friend: index < widgetFriends.count ? widgetFriends[index] : nil)
                    .frame(width: min(54, geo.size.width * 0.17), height: min(54, geo.size.width * 0.17))
                  Text(index < widgetFriends.count ? widgetFriends[index].name : "Add friend")
                    .font(.system(size: 11, weight: .semibold))
                    .lineLimit(2).minimumScaleFactor(0.7)
                    .multilineTextAlignment(.center)
                  if index < widgetFriends.count, let date = widgetFriends[index].sobrietyDate, !date.isEmpty {
                    let progress = display(days(date, entry.date))
                    Text("\(progress.0) \(progress.1)")
                      .font(.system(size: 10, weight: .medium))
                      .foregroundStyle(.secondary)
                      .lineLimit(1).minimumScaleFactor(0.65)
                  }
                }.frame(maxWidth: .infinity, alignment: .top)
              }
            }
          }
          .padding(15)
          .foregroundColor(.white)
        } else {
          // Accessory families need their own compact treatment.
          VStack(spacing: 2) {
            Text("\(value.0)").font(.headline)
            Text(value.1).font(.caption2)
          }
          .minimumScaleFactor(0.6)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    .id(entry.showBack)
    .transition(.asymmetric(
      insertion: .push(from: entry.showBack ? .trailing : .leading),
      removal: .push(from: entry.showBack ? .leading : .trailing)
    ))
    .animation(.easeInOut(duration: 0.8), value: entry.showBack)
    // WidgetKit does not provide arbitrary Home Screen transparency. The
    // system widget background is the closest reliable transparent treatment;
    // keep the large legacy dark presentation and avoid tying the container
    // background to the user's coin color.
    .v1ceWidgetBackground(Color.clear)
    .widgetURL(URL(string: "v1ce://widget"))
  }
}

@main
struct V1CEWidget: Widget {
  let kind = "V1CEWidget"

  init() {
    registerWidgetFonts()
  }

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { V1CEWidgetView(entry: $0) }
      .configurationDisplayName("V1CE")
      .description("Your V1CE sobriety count.")
      .supportedFamilies([
        .systemSmall, .systemMedium, .systemLarge,
        .accessoryCircular, .accessoryRectangular, .accessoryInline
      ])
  }
}
