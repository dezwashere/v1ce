import SwiftUI
import WidgetKit
import Foundation
import CoreText

private let group = "group.app.v1ce"

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

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    sobrietyDate = try c.decode(String.self, forKey: .sobrietyDate)
    displayName = try c.decodeIfPresent(String.self, forKey: .displayName) ?? ""
    coinColor = try c.decodeIfPresent(String.self, forKey: .coinColor) ?? "#F5D680"
    coinShape = try c.decodeIfPresent(String.self, forKey: .coinShape) ?? "circle"
    coinShapePath = try c.decodeIfPresent(String.self, forKey: .coinShapePath)
    numberStyle = try c.decodeIfPresent(String.self, forKey: .numberStyle) ?? "classic"
    coinShowBorder = try c.decodeIfPresent(Bool.self, forKey: .coinShowBorder) ?? true
    coinBorderColor = try c.decodeIfPresent(String.self, forKey: .coinBorderColor)
    coinNumberColor = try c.decodeIfPresent(String.self, forKey: .coinNumberColor)
    coinMotto = try c.decodeIfPresent(String.self, forKey: .coinMotto) ?? ""
  }
}

private func snap() -> Snapshot? {
  guard let d = UserDefaults(suiteName: group)?.data(forKey: "v1ce_widget_profile_v1") else { return nil }
  return try? JSONDecoder().decode(Snapshot.self, from: d)
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
  "classic": "Big Shoulders Stencil",
  "big_shoulders_stencil": "Big Shoulders Stencil",
  "roboto_mono": "Roboto Mono",
  "oswald": "Oswald",
  "raleway": "Raleway",
  "fraunces": "Fraunces",
  "caveat": "Caveat",
  "dyna_puff": "DynaPuff"
]

private func widgetFont(_ style: String, size: CGFloat) -> Font {
  Font.custom(fontNames[style] ?? "Big Shoulders Stencil", size: size)
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
  "star": "50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35",
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
    if name == "circle" { return Path(ellipseIn: rect) }
    if name == "drawn", let custom { return polygon(custom, in: rect) }
    return polygon(shapePoints[name] ?? shapePoints["hexagon"]!, in: rect)
  }
}

private func registerWidgetFonts() {
  let names = [
    "BigShouldersStencilDisplay-Regular",
    "RobotoMono-Variable", "Oswald-Variable", "Raleway-Variable",
    "Fraunces-Variable", "Caveat-Regular", "DynaPuff-Variable"
  ]
  for name in names {
    guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { continue }
    CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
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
    let size: CGFloat = family == .systemLarge ? 58 : family == .systemMedium ? 42 : 34
    let shapeName = data?.coinShape ?? "circle"
    let font = widgetFont(data?.numberStyle ?? "classic", size: size)

    ZStack {
      CoinShape(name: shapeName, custom: data?.coinShapePath)
        .fill(bg)
      if showBorder {
        CoinShape(name: shapeName, custom: data?.coinShapePath)
          .stroke(border, lineWidth: family == .systemLarge ? 3 : 2)
          .padding(family == .systemLarge ? 7 : 4)
      }
      if entry.showBack {
        VStack(spacing: family == .systemLarge ? 8 : 4) {
          Text("V1CE")
            .font(.system(size: family == .systemLarge ? 14 : 10, weight: .bold))
            .tracking(family == .systemLarge ? 4 : 2.5)
            .opacity(0.7)
          Text("\(value.0)")
            .font(font)
            .minimumScaleFactor(0.45)
            .lineLimit(1)
          Text((data?.coinMotto.isEmpty == false ? data?.coinMotto : nil) ?? "FREE FROM")
            .font(.system(size: family == .systemLarge ? 11 : 8, weight: .semibold))
            .tracking(1.8)
            .multilineTextAlignment(.center)
            .lineLimit(3)
            .opacity(0.7)
            .padding(.horizontal, family == .systemLarge ? 18 : 8)
        }
      } else {
        VStack(spacing: family == .systemLarge ? 5 : 2) {
          Text("\(value.0)")
            .font(font)
            .minimumScaleFactor(0.45)
            .lineLimit(1)
          Text(value.1)
            .font(.system(size: family == .systemLarge ? 11 : 8, weight: .semibold, design: .default))
            .tracking(1.8)
          if let name = data?.displayName, !name.isEmpty {
            Text(name.uppercased())
              .font(.system(size: family == .systemLarge ? 8 : 6, weight: .medium))
              .tracking(1.2)
              .lineLimit(1)
          }
          if family == .systemLarge, let motto = data?.coinMotto, !motto.isEmpty {
            Text(motto)
              .font(.system(size: 10))
              .multilineTextAlignment(.center)
              .lineLimit(3)
              .padding(.horizontal, 18)
          }
        }
      }
      .foregroundColor(text)
      .padding(10)
    }
    .id(entry.showBack)
    .transition(.asymmetric(
      insertion: .push(from: entry.showBack ? .trailing : .leading),
      removal: .push(from: entry.showBack ? .leading : .trailing)
    ))
    .animation(.easeInOut(duration: 0.8), value: entry.showBack)
    .v1ceWidgetBackground(bg)
    .widgetURL(URL(string: "v1ce://home"))
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
