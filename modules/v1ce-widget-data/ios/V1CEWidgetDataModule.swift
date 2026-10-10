import ExpoModulesCore
import WidgetKit

private let appGroup = "group.app.v1ce"
private let snapshotKey = "v1ce_widget_profile_v1"
private let widgetKind = "V1CEWidget"

public class V1CEWidgetDataModule: Module {
  public func definition() -> ModuleDefinition {
    Name("V1CEWidgetData")

    Function("setSnapshot") { (json: String) in
      guard
        let data = json.data(using: .utf8),
        let defaults = UserDefaults(suiteName: appGroup)
      else { return }

      defaults.set(data, forKey: snapshotKey)
      defaults.synchronize()
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }

    Function("setFriends") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroup) else { return }
      defaults.set(json, forKey: "v1ce_widget_selected_friends")
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }

    Function("clearSnapshot") {
      guard let defaults = UserDefaults(suiteName: appGroup) else { return }

      defaults.removeObject(forKey: snapshotKey)
      defaults.synchronize()
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }
  }
}
