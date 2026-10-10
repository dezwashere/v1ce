package app.v1ce.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.glance.GlanceModifier
import androidx.glance.background
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
import org.json.JSONArray
import android.appwidget.AppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetManager

private val Context.v1ceWidgetStore by preferencesDataStore(name="v1ce_widget")

private fun circularAvatar(source:Bitmap, diameter:Int=112):Bitmap {
 val output=Bitmap.createBitmap(diameter,diameter,Bitmap.Config.ARGB_8888)
 val canvas=Canvas(output)
 val path=Path().apply{addCircle(diameter/2f,diameter/2f,diameter/2f,Path.Direction.CW)}
 canvas.clipPath(path)
 val side=minOf(source.width,source.height)
 val left=(source.width-side)/2
 val top=(source.height-side)/2
 canvas.drawBitmap(source,android.graphics.Rect(left,top,left+side,top+side),android.graphics.Rect(0,0,diameter,diameter),Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG))
 return output
}
private fun markerFriendAvatar():Bitmap {
 val side=112
 val bitmap=Bitmap.createBitmap(side,side,Bitmap.Config.ARGB_8888)
 val c=Canvas(bitmap)
 val p=Paint(Paint.ANTI_ALIAS_FLAG).apply {color=android.graphics.Color.WHITE;style=Paint.Style.FILL}
 c.drawCircle(56f,56f,54f,p)
 p.color=android.graphics.Color.BLACK
 p.style=Paint.Style.STROKE
 p.strokeWidth=4f
 p.strokeCap=Paint.Cap.ROUND
 c.drawCircle(56f,56f,54f,p)
 c.drawOval(31f,22f,81f,90f,p)
 c.drawArc(6f,80f,106f,160f,190f,160f,false,p)
 c.drawLine(42f,52f,47f,51f,p)
 c.drawLine(65f,51f,70f,52f,p)
 c.drawArc(43f,59f,70f,77f,10f,155f,false,p)
 val hair=Path().apply {moveTo(31f,51f);quadTo(20f,13f,59f,20f);quadTo(84f,17f,81f,51f)}
 c.drawPath(hair,p)
 return bitmap
}
private fun backDecoration(icon:String, tint:Int):Bitmap? {
 if(icon=="none" || icon.isBlank()) return null
 val bmp=Bitmap.createBitmap(56,56,Bitmap.Config.ARGB_8888)
 val canvas=Canvas(bmp)
 val p=Paint(Paint.ANTI_ALIAS_FLAG).apply { color=tint; style=Paint.Style.STROKE; strokeWidth=3f; strokeCap=Paint.Cap.ROUND; strokeJoin=Paint.Join.ROUND }
 fun line(vararg coords:Float){val path=Path();path.moveTo(coords[0],coords[1]);for(i in 2 until coords.size step 2)path.lineTo(coords[i],coords[i+1]);canvas.drawPath(path,p)}
 when(icon){
  "mountain"->{line(3f,45f,20f,13f,32f,34f,39f,23f,53f,45f);line(15f,23f,20f,29f,25f,23f)}
  "palm"->{line(28f,49f,29f,16f);line(29f,16f,9f,15f,4f,25f);line(29f,16f,42f,7f,53f,15f);line(29f,16f,11f,28f);line(29f,16f,47f,30f)}
  "smiley"->{canvas.drawCircle(28f,28f,22f,p);p.style=Paint.Style.FILL;canvas.drawCircle(20f,22f,2f,p);canvas.drawCircle(36f,22f,2f,p);p.style=Paint.Style.STROKE;canvas.drawArc(15f,16f,41f,42f,20f,140f,false,p)}
  "clover"->{for((x,y) in listOf(20f to 20f,36f to 20f,20f to 36f,36f to 36f))canvas.drawCircle(x,y,9f,p);line(28f,30f,34f,53f)}
  "butterfly"->{canvas.drawOval(5f,7f,27f,29f,p);canvas.drawOval(29f,7f,51f,29f,p);canvas.drawOval(10f,29f,27f,48f,p);canvas.drawOval(29f,29f,46f,48f,p);line(28f,13f,28f,45f)}
  "wave"->{for(y in listOf(18f,34f)){val path=Path();path.moveTo(2f,y);path.cubicTo(11f,y-11f,19f,y+11f,28f,y);path.cubicTo(37f,y-11f,45f,y+11f,54f,y);canvas.drawPath(path,p)}}
  else->return null
 }
 return bmp
}
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
  val preferences=context.v1ceWidgetStore.data.first()
  val raw=preferences[stringPreferencesKey("snapshot")]
  val friendsJson=preferences[stringPreferencesKey("friends")]
  val selectedFriends=runCatching{JSONArray(friendsJson ?: "[]")}.getOrDefault(JSONArray())
  val placeholderAvatar=markerFriendAvatar()
  val avatarBitmaps=withContext(Dispatchers.IO) {
   (0 until minOf(3,selectedFriends.length())).map { index ->
    val avatar=selectedFriends.optJSONObject(index)?.optString("avatar").orEmpty()
    runCatching {
     val url=URL(avatar)
     if(url.protocol!="https") null else {
      val connection=url.openConnection().apply { connectTimeout=2500; readTimeout=2500 }
      connection.getInputStream().use { BitmapFactory.decodeStream(it)?.let { bitmap -> circularAvatar(bitmap) } }
    }
    }.getOrNull()
   }
  }
  // Read widget dimensions outside Compose to avoid the incompatible
  // CompositionLocal inline call in the Android Kotlin compiler.
  val appWidgetId=GlanceAppWidgetManager(context).getAppWidgetId(id)
  val options=AppWidgetManager.getInstance(context).getAppWidgetOptions(appWidgetId)
  val width=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
  val height=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)
  val isLarge=width >= 230 && height >= 180
  provideContent{
   val d=raw?.let{JSONObject(it)}
   val date=d?.optString("sobrietyDate","")?:""
   val name=d?.optString("displayName","")?:""
   val bg=coinColor(d?.optString("coinColor","#F5D680")?:"#F5D680")
   val friends=runCatching{JSONArray(friendsJson ?: "[]")}.getOrDefault(JSONArray())
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
   val backIcon=d?.optString("coinBackIcon","none") ?: "none"
   val backImage=if(showBack)backDecoration(backIcon,android.graphics.Color.rgb((numberColor.red*255).toInt(),(numberColor.green*255).toInt(),(numberColor.blue*255).toInt())) else null
   val shapeRes=context.resources.getIdentifier("v1ce_shape_$shape","drawable",context.packageName)
   val borderRes=context.resources.getIdentifier("v1ce_shape_${shape}_border","drawable",context.packageName)

   Box((if(isLarge) GlanceModifier.fillMaxSize().background(ColorProvider(Color.Black)) else GlanceModifier.fillMaxSize()).clickable(actionStartActivity<app.v1ce.MainActivity>()),contentAlignment=Alignment.Center){
    if(!isLarge && shapeRes!=0) Image(ImageProvider(shapeRes),"V1CE coin",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(bg)))
    if(!isLarge && showBorder && borderRes!=0) Image(ImageProvider(borderRes),"",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(borderColor)))
    if(isLarge){
     Column(horizontalAlignment=Alignment.CenterHorizontally,verticalAlignment=Alignment.CenterVertically){
      Text("V1CE",style=TextStyle(color=ColorProvider(Color.White),fontSize=15.sp,fontWeight=FontWeight.Bold))
      Box(GlanceModifier.width(minOf(148f,width*0.46f,height*0.43f).coerceAtLeast(92f).dp).height(minOf(148f,width*0.46f,height*0.43f).coerceAtLeast(92f).dp),contentAlignment=Alignment.Center){
       if(shapeRes!=0)Image(ImageProvider(shapeRes),"Your coin",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(bg)))
       if(showBorder && borderRes!=0)Image(ImageProvider(borderRes),"",GlanceModifier.fillMaxSize(),colorFilter=ColorFilter.tint(ColorProvider(borderColor)))
       Column(horizontalAlignment=Alignment.CenterHorizontally){
        Text(value.toString(),style=TextStyle(color=ColorProvider(numberColor),fontSize=38.sp,fontWeight=FontWeight.Bold,fontFamily=fontFamily(style),textAlign=TextAlign.Center))
        Text(label,style=TextStyle(color=ColorProvider(numberColor),fontSize=11.sp,textAlign=TextAlign.Center))
        if(showBack && backImage!=null) Image(ImageProvider(backImage),"Coin back decoration",GlanceModifier.width(20.dp).height(20.dp))
        if(showBack && name.isNotBlank()) Text(name.uppercase(),style=TextStyle(color=ColorProvider(numberColor),fontSize=8.sp,textAlign=TextAlign.Center),maxLines=1)
       }
      }
      if(friends.length()==0){
       Text("Add Friends",style=TextStyle(color=ColorProvider(Color.White),fontSize=22.sp))
      }else{
       Row(verticalAlignment=Alignment.CenterVertically){
        for(i in 0..2){
         val friend=if(i<friends.length())friends.optJSONObject(i) else null
         Column(modifier=GlanceModifier.defaultWeight(),horizontalAlignment=Alignment.CenterHorizontally){
          val avatar=avatarBitmaps.getOrNull(i)
          if(avatar!=null){
           Image(ImageProvider(avatar),"Friend avatar",GlanceModifier.width(minOf(54f,width*0.17f).dp).height(minOf(54f,width*0.17f).dp))
          }else if(friend!=null){
           Image(ImageProvider(placeholderAvatar),"Marker style friend portrait",GlanceModifier.width(minOf(54f,width*0.17f).dp).height(minOf(54f,width*0.17f).dp))
          }else{
           Text("◯",style=TextStyle(color=ColorProvider(Color.White),fontSize=32.sp))
          }
          Text(friend?.optString("name") ?: "Add Friend",style=TextStyle(color=ColorProvider(Color.White),fontSize=11.sp,textAlign=TextAlign.Center),maxLines=2)
          val friendDate=friend?.optString("sobrietyDate").orEmpty()
          if(friendDate.isNotBlank() && friendDate!="null"){
           val friendDays=runCatching{java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.parse(friendDate.take(10)),java.time.LocalDate.now()).coerceAtLeast(0).toInt()}.getOrNull()
           if(friendDays!=null){
            val fy=friendDays/365;val fm=(friendDays%365)/30
            val fv=if(fy>0)fy else if(fm>0)fm else friendDays
            val fl=if(fy>0)if(fy==1)"YEAR" else "YEARS" else if(fm>0)if(fm==1)"MONTH" else "MONTHS" else "DAYS"
            Text("$fv $fl",style=TextStyle(color=ColorProvider(Color.White),fontSize=10.sp,textAlign=TextAlign.Center),maxLines=1)
           }
          }
         }
        }
       }
      }
      Text("Manage widget friends from the Friends page",style=TextStyle(color=ColorProvider(Color.White),fontSize=10.sp))
     }
    }else Column(horizontalAlignment=Alignment.CenterHorizontally,verticalAlignment=Alignment.CenterVertically){
     val motto=d?.optString("coinMotto","")?:""
     if(showBack){
      Text("V1CE",style=TextStyle(color=ColorProvider(numberColor),fontSize=10.sp,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center))
      Text(value.toString(),style=TextStyle(color=ColorProvider(numberColor),fontSize=if(isLarge)48.sp else 34.sp,fontWeight=FontWeight.Bold,fontFamily=fontFamily(style),textAlign=TextAlign.Center))
      Text(if(motto.isNotBlank())motto else "FREE FROM",style=TextStyle(color=ColorProvider(numberColor),fontSize=8.sp,fontWeight=FontWeight.Medium,textAlign=TextAlign.Center),maxLines=2)
      if(backImage!=null) Image(ImageProvider(backImage),"Coin back decoration",GlanceModifier.width(18.dp).height(18.dp))
      if(name.isNotBlank()) Text(name.uppercase(),style=TextStyle(color=ColorProvider(numberColor),fontSize=7.sp,fontWeight=FontWeight.Medium,textAlign=TextAlign.Center),maxLines=1)
     }else{
      Text(value.toString(),style=TextStyle(color=ColorProvider(numberColor),fontSize=if(isLarge)48.sp else 34.sp,fontWeight=FontWeight.Bold,fontFamily=fontFamily(style),textAlign=TextAlign.Center))
      Text(label,style=TextStyle(color=ColorProvider(numberColor),fontSize=9.sp,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center))

     }
    }
   }
  }
 }
}
