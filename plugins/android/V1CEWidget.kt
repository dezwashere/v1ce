package app.v1ce.widget

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.text.TextAlign
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.ColorFilter
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.flow.first
import org.json.JSONObject

private val Context.v1ceWidgetStore by preferencesDataStore(name="v1ce_widget")

private fun parseColor(value:String, fallback:Color):Color=runCatching{Color(android.graphics.Color.parseColor(value))}.getOrDefault(fallback)
private fun coinColor(value:String):Color=when(value){
 "gold"->Color(0xFFF5D680); "silver"->Color(0xFFE0E0E0); "bronze"->Color(0xFFCD7F32)
 "rose_gold"->Color(0xFFE8B4B8); "midnight"->Color(0xFF0A0A0A); "emerald"->Color(0xFF2E8B57)
 else->parseColor(value,Color(0xFFF5D680))
}
private fun luminance(c:Color):Float=0.299f*c.red+0.587f*c.green+0.114f*c.blue
private fun contrast(c:Color):Color=if(luminance(c)>0.6f)Color.Black else if(luminance(c)>0.5f)Color(0xFF0A0A0A) else Color.White
private fun shapeName(raw:String)=when(raw){"circle","hexagon","octagon","shield","diamond","star","badge","arrow"->raw else->"hexagon"}
private fun fontFamily(style:String)=when(style){
 "roboto_mono"->FontFamily.Monospace
 "big_shoulders_stencil"->FontFamily.SansSerif
 "oswald","raleway"->FontFamily.SansSerif
 "fraunces"->FontFamily.Serif
 "caveat","dyna_puff"->FontFamily.Cursive
 else->FontFamily.SansSerif
}

class V1CEWidget:GlanceAppWidget(){
 override val sizeMode:SizeMode=SizeMode.Exact
 override suspend fun provideGlance(context:Context,id:androidx.glance.GlanceId){
  val raw=context.v1ceWidgetStore.data.first()[stringPreferencesKey("snapshot")]
  provideContent{
   val d=raw?.let{JSONObject(it)}
   val date=d?.optString("sobrietyDate","")?:""
   val name=d?.optString("displayName","")?:""
   val bg=coinColor(d?.optString("coinColor","#F5D680")?:"#F5D680")
   val isLarge=false
   val numberOverride=d?.optString("coinNumberColor","")?:""
   val borderOverride=d?.optString("coinBorderColor","")?:""
   val numberColor=if(numberOverride.isNotBlank())parseColor(numberOverride,contrast(bg)) else contrast(bg)
   val borderColor=if(borderOverride.isNotBlank())parseColor(borderOverride,contrast(bg)) else contrast(bg)
   val showBorder=d?.optBoolean("coinShowBorder",true)?:true
   val shape=shapeName(d?.optString("coinShape","circle")?:"circle")
   val style=d?.optString("numberStyle","classic")?:"classic"
   val days=runCatching{java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.parse(date.take(10)),java.time.LocalDate.now()).coerceAtLeast(0).toInt()}.getOrDefault(0)
   val y=days/365;val m=(days%365)/30
   val value=if(y>0)y else if(m>0)m else days
   val label=if(y>0)if(y==1)"YEAR" else "YEARS" else if(m>0)if(m==1)"MONTH" else "MONTHS" else "DAYS"
   val showBack=((System.currentTimeMillis()/1_800_000L)%2L)==1L
   val shapeRes=context.resources.getIdentifier("v1ce_shape_$shape","drawable",context.packageName)
   val borderRes=context.resources.getIdentifier("v1ce_shape_${shape}_border","drawable",context.packageName)

   Box(GlanceModifier.fillMaxSize().clickable(actionStartActivity<app.v1ce.MainActivity>()),contentAlignment=Alignment.Center){
    if(shapeRes!=0) Image(ImageProvider(shapeRes),"V1CE coin",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(bg)))
    if(showBorder && borderRes!=0) Image(ImageProvider(borderRes),"",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(borderColor)))
    Column(horizontalAlignment=Alignment.CenterHorizontally,verticalAlignment=Alignment.CenterVertically){
     val motto=d?.optString("coinMotto","")?:""
     if(showBack){
      Text("V1CE",style=TextStyle(color=ColorProvider(numberColor),fontSize=10.sp,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center))
      Text(value.toString(),style=TextStyle(color=ColorProvider(numberColor),fontSize=if(isLarge)48.sp else 34.sp,fontWeight=FontWeight.Bold,fontFamily=fontFamily(style),textAlign=TextAlign.Center))
      Text(if(motto.isNotBlank())motto else "FREE FROM",style=TextStyle(color=ColorProvider(numberColor),fontSize=8.sp,fontWeight=FontWeight.Medium,textAlign=TextAlign.Center),maxLines=2)
     }else{
      Text(value.toString(),style=TextStyle(color=ColorProvider(numberColor),fontSize=if(isLarge)48.sp else 34.sp,fontWeight=FontWeight.Bold,fontFamily=fontFamily(style),textAlign=TextAlign.Center))
      Text(label,style=TextStyle(color=ColorProvider(numberColor),fontSize=9.sp,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center))
      if(name.isNotBlank()) Text(name.uppercase(),style=TextStyle(color=ColorProvider(numberColor),fontSize=7.sp,fontWeight=FontWeight.Medium,textAlign=TextAlign.Center),maxLines=1)
     }
    }
   }
  }
 }
}
