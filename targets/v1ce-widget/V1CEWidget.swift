import SwiftUI
import WidgetKit
import Foundation
import CoreText

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
private let isPremiumKey = "v1ce_widget_is_premium"
private let personalQuoteKey = "v1ce_widget_personal_quote"
private let selectedFriendsKey = "v1ce_widget_selected_friends"

private struct WidgetFriend: Decodable, Identifiable {
  let id: String
  let name: String
  let avatar: String
}

private func selectedFriends() -> [WidgetFriend] {
  guard let json = UserDefaults(suiteName: group)?.string(forKey: selectedFriendsKey),
        let data = json.data(using: .utf8) else { return [] }
  return Array((try? JSONDecoder().decode([WidgetFriend].self, from: data))?.prefix(3) ?? [])
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
  let isPremium: Bool
  let personalQuote: String

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
    numberStyle = try c.decodeIfPresent(String.self, forKey: .numberStyle) ?? "classic"
    coinShowBorder = try c.decodeIfPresent(Bool.self, forKey: .coinShowBorder) ?? true
    coinBorderColor = try c.decodeIfPresent(String.self, forKey: .coinBorderColor)
    coinNumberColor = try c.decodeIfPresent(String.self, forKey: .coinNumberColor)
    coinMotto = try c.decodeIfPresent(String.self, forKey: .coinMotto) ?? ""
    isPremium = try c.decodeIfPresent(Bool.self, forKey: .isPremium) ?? false
    personalQuote = try c.decodeIfPresent(String.self, forKey: .personalQuote) ?? ""
  }
}

private func snap() -> Snapshot? {
  guard let defaults = UserDefaults(suiteName: group) else { return nil }

  if defaults.integer(forKey: readyKey) == 1,
     let sobrietyDate = defaults.string(forKey: sobrietyDateKey),
     !sobrietyDate.isEmpty {
    return Snapshot(
      sobrietyDate: sobrietyDate,
      displayName: defaults.string(forKey: displayNameKey) ?? "",
      coinColor: defaults.string(forKey: coinColorKey) ?? "#F5D680",
      coinShape: defaults.string(forKey: coinShapeKey) ?? "circle",
      coinShapePath: defaults.string(forKey: coinShapePathKey),
      numberStyle: defaults.string(forKey: numberStyleKey) ?? "classic",
      coinShowBorder: defaults.integer(forKey: coinShowBorderKey) != 0,
      coinBorderColor: defaults.string(forKey: coinBorderColorKey),
      coinNumberColor: defaults.string(forKey: coinNumberColorKey),
      coinMotto: defaults.string(forKey: coinMottoKey) ?? "",
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
  "classic": "Cinzel",
  "poppins": "Poppins",
  "monospace": "Space Mono",
  "fredoka": "Fredoka",
  "serif": "IBM Plex Serif",
  "dmsans": "DM Sans",
  "courier": "Courier Prime",
  "bodoni": "Bodoni Moda",
  "syne": "Syne",
  "pacifico": "Pacifico",
  "bebas": "Bebas Neue",
  "inter": "Inter",
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
    "Cinzel", "Poppins", "SpaceMono", "Fredoka", "IBMPlexSerif", "DMSans",
    "CourierPrime", "BodoniModa", "Syne", "Pacifico", "BebasNeue", "Inter",
    "RobotoMono", "Oswald", "Raleway", "Fraunces", "Caveat", "DynaPuff"
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
    let shapeName = data?.coinShape ?? "circle"
    let style = data?.numberStyle ?? "classic"

    GeometryReader { geo in
      let isSmall = family == .systemSmall
      let isMedium = family == .systemMedium
      let coinSide = max(0, min(geo.size.width, geo.size.height) - (isSmall ? 20 : 32))
      let numberFont = widgetFont(style, size: isSmall ? 34 : 42)
      let labelFont = widgetFont(style, size: isSmall ? 9 : 11)
      let detailFont = widgetFont(style, size: isSmall ? 7 : 9)

      let coin = ZStack {
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
          if let name = data?.displayName, !name.isEmpty {
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

      Group {
        if isSmall {
          coin.frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if isMedium {
          HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 4) {
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
          }
          .padding(10)
        } else if family == .systemLarge {
          // Review layout only: friend profiles require a shared friend snapshot.
          VStack(alignment: .leading, spacing: 16) {
            Text("FRIENDS")
              .font(.system(size: 15, weight: .semibold))
              .tracking(2)
            HStack(spacing: 10) {
              ForEach(0..<3, id: \.self) { _ in
                VStack(spacing: 8) {
                  Circle()
                    .strokeBorder(.secondary, lineWidth: 1)
                    .frame(width: 64, height: 64)
                    .overlay(Image(systemName: "person").foregroundStyle(.secondary))
                  Text("Friend")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
              }
            }
            Spacer(minLength: 0)
            Text("Friend data connection pending")
              .font(.system(size: 11))
              .foregroundStyle(.secondary)
          }
          .padding(18)
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
    .v1ceWidgetBackground(bg)
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
