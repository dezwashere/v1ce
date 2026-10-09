package app.v1ce.widgetdata
import android.content.Intent
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.runBlocking
import app.v1ce.widget.V1CEWidget
import androidx.glance.appwidget.updateAll
private val android.content.Context.v1ceWidgetStore by preferencesDataStore(name = "v1ce_widget")
class V1CEWidgetDataModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("V1CEWidgetData")
    Function("setSnapshot") { json: String ->
      val context = appContext.reactContext ?: return@Function
      runBlocking { context.v1ceWidgetStore.updateData { it.toMutablePreferences().apply { set(stringPreferencesKey("snapshot"), json) } } }
      runCatching { runBlocking { V1CEWidget().updateAll(context) } }
      context.sendBroadcast(Intent("app.v1ce.WIDGET_UPDATE").setPackage(context.packageName))
    }
    Function("setFriends") { json: String ->
      val context = appContext.reactContext ?: return@Function
      runBlocking { context.v1ceWidgetStore.updateData { it.toMutablePreferences().apply { set(stringPreferencesKey("friends"), json) } } }
      runCatching { runBlocking { V1CEWidget().updateAll(context) } }
    }
    Function("clearSnapshot") {
      val context = appContext.reactContext ?: return@Function
      runBlocking { context.v1ceWidgetStore.updateData { it.toMutablePreferences().apply { remove(stringPreferencesKey("snapshot")); remove(stringPreferencesKey("friends")) } } }
      runCatching { runBlocking { V1CEWidget().updateAll(context) } }
    }
  }
}