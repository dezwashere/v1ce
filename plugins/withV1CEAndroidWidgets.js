const {withAndroidManifest,withAppBuildGradle,withDangerousMod}=require("expo/config-plugins");
const fs=require("fs"),path=require("path");

const SHAPES={
  circle:"M50,2 A48,48 0,1 1 50,98 A48,48 0,1 1 50,2 Z",
  hexagon:"M25,2 L75,2 L98,50 L75,98 L25,98 L2,50 Z",
  octagon:"M30,2 L70,2 L98,30 L98,70 L70,98 L30,98 L2,70 L2,30 Z",
  shield:"M50,2 L98,17 L98,65 L50,98 L2,65 L2,17 Z",
  diamond:"M50,2 L96,50 L50,98 L4,50 Z",
  star:"M50,2 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z",
  badge:"M50,2 L65,12 L82,7 L90,22 L98,30 L93,50 L98,70 L90,78 L82,93 L65,88 L50,98 L35,88 L18,93 L10,78 L2,70 L7,50 L2,30 L10,22 L18,7 L35,12 Z",
  arrow:"M2,35 L55,35 L55,10 L98,50 L55,90 L55,65 L2,65 Z"
};

function vectorXml(pathData,stroke){
  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="100dp" android:height="100dp" android:viewportWidth="100" android:viewportHeight="100">
  <path android:pathData="${pathData}" android:fillColor="${stroke ? "@android:color/transparent" : "#FFFFFFFF"}"${stroke ? ' android:strokeColor="#FFFFFFFF" android:strokeWidth="3" android:strokeLineJoin="round"' : ""}/>
</vector>`;
}

module.exports=function(config){
 config=withAppBuildGradle(config,c=>{
  let x=c.modResults.contents;
  for(const d of ['implementation "androidx.glance:glance:1.2.0"','implementation "androidx.glance:glance-appwidget:1.2.0"','implementation "androidx.datastore:datastore-preferences:1.2.1"'])
   if(!x.includes(d))x=x.replace(/dependencies\s*\{/,m=>m+"\n    "+d);
  c.modResults.contents=x;return c;
 });
 config=withAndroidManifest(config,c=>{
  const a=c.modResults.manifest.application?.[0];if(!a)return c;
  a.receiver=a.receiver||[];
  if(!a.receiver.some(r=>r.$?.["android:name"]==="app.v1ce.widget.V1CEWidgetReceiver"))
   a.receiver.push({$:{"android:name":"app.v1ce.widget.V1CEWidgetReceiver","android:exported":"true"},
    "intent-filter":[{action:[{$:{"android:name":"android.appwidget.action.APPWIDGET_UPDATE"}}]}],
    "meta-data":[{$:{"android:name":"android.appwidget.provider","android:resource":"@xml/v1ce_widget_info"}}]});
  return c;
 });
 return withDangerousMod(config,["android",async c=>{
  const root=c.modRequest.platformProjectRoot;
  const src=path.join(c.modRequest.projectRoot,"plugins","android");
  const pkg=path.join(root,"app/src/main/java/app/v1ce/widget");
  const res=path.join(root,"app/src/main/res/xml");
  const draw=path.join(root,"app/src/main/res/drawable");
  fs.mkdirSync(pkg,{recursive:true});fs.mkdirSync(res,{recursive:true});fs.mkdirSync(draw,{recursive:true});
  fs.copyFileSync(path.join(src,"V1CEWidget.kt"),path.join(pkg,"V1CEWidget.kt"));
  fs.copyFileSync(path.join(src,"V1CEWidgetReceiver.kt"),path.join(pkg,"V1CEWidgetReceiver.kt"));
  fs.copyFileSync(path.join(src,"v1ce_widget_info.xml"),path.join(res,"v1ce_widget_info.xml"));
  for(const [name,data] of Object.entries(SHAPES)){
    fs.writeFileSync(path.join(draw,`v1ce_shape_${name}.xml`),vectorXml(data,false));
    fs.writeFileSync(path.join(draw,`v1ce_shape_${name}_border.xml`),vectorXml(data,true));
  }
  return c;
 }]);
};
