const {withDangerousMod}=require("expo/config-plugins");
const fs=require("fs"),path=require("path"),https=require("https");

const expoFonts=[
 ["@expo-google-fonts/cinzel","Cinzel.ttf","700Bold"],
 ["@expo-google-fonts/poppins","Poppins.ttf","700Bold"],
 ["@expo-google-fonts/space-mono","SpaceMono.ttf","700Bold"],
 ["@expo-google-fonts/fredoka","Fredoka.ttf","400Regular"],
 ["@expo-google-fonts/ibm-plex-serif","IBMPlexSerif.ttf","700Bold"],
 ["@expo-google-fonts/dm-sans","DMSans.ttf","700Bold"],
 ["@expo-google-fonts/courier-prime","CourierPrime.ttf","700Bold"],
 ["@expo-google-fonts/bodoni-moda","BodoniModa.ttf","700Bold"],
 ["@expo-google-fonts/syne","Syne.ttf","700Bold"],
 ["@expo-google-fonts/pacifico","Pacifico.ttf","400Regular"],
 ["@expo-google-fonts/bebas-neue","BebasNeue.ttf","400Regular"],
 ["@expo-google-fonts/inter","Inter.ttf","700Bold"],
 ["@expo-google-fonts/roboto-mono","RobotoMono.ttf","700Bold"],
 ["@expo-google-fonts/oswald","Oswald.ttf","600SemiBold"],
 ["@expo-google-fonts/raleway","Raleway.ttf","700Bold"],
 ["@expo-google-fonts/fraunces","Fraunces.ttf","700Bold"],
 ["@expo-google-fonts/caveat","Caveat.ttf","400Regular"],
 ["@expo-google-fonts/dynapuff","DynaPuff.ttf","600SemiBold"]
];

const localFonts=[
 ["assets/fonts/BigShouldersStencilDisplay-Regular.ttf","BigShouldersStencilDisplay-Regular.ttf"]
];

const remoteFonts=[];

function findTtf(root,weight){
 const found=[];
 const walk=(dir)=>{
  if(!fs.existsSync(dir))return;
  for(const name of fs.readdirSync(dir)){
   const full=path.join(dir,name),stat=fs.statSync(full);
   if(stat.isDirectory())walk(full);
   else if(name.toLowerCase().endsWith(".ttf"))found.push(full);
  }
 };
 walk(root);
 return found.find(x=>x.includes(weight))||found[0]||null;
}

function download(url,dest){
 return new Promise((resolve,reject)=>{
  const file=fs.createWriteStream(dest);
  https.get(url,res=>{
   if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
    file.close();fs.unlinkSync(dest);
    return download(res.headers.location,dest).then(resolve,reject);
   }
   if(res.statusCode!==200){
    file.close();fs.unlinkSync(dest);
    return reject(new Error("HTTP "+res.statusCode+" for "+url));
   }
   res.pipe(file);
   file.on("finish",()=>file.close(resolve));
  }).on("error",e=>{
   try{file.close();fs.unlinkSync(dest)}catch{}
   reject(e);
  });
 });
}

module.exports=function(config){
 config=withDangerousMod(config,["ios",async c=>{
  const projectRoot=c.modRequest.projectRoot;
  const target=path.join(projectRoot,"targets","v1ce-widget","assets");
  const appFonts=path.join(projectRoot,"assets","fonts","native");
  fs.mkdirSync(target,{recursive:true});
  fs.mkdirSync(appFonts,{recursive:true});

  for(const [relativePath,outName] of localFonts){
   const source=path.join(projectRoot,relativePath);
   if(fs.existsSync(source)){
    fs.copyFileSync(source,path.join(target,outName));
    fs.copyFileSync(source,path.join(appFonts,outName));
   }
  }

  for(const [pkg,outName,weight] of expoFonts){
   const source=findTtf(path.join(projectRoot,"node_modules",pkg),weight);
   if(source){
    fs.copyFileSync(source,path.join(target,outName));
    fs.copyFileSync(source,path.join(appFonts,outName));
   }
  }

  for(const [url,outName] of remoteFonts){
   const dest=path.join(target,outName);
   if(!fs.existsSync(dest))await download(url,dest);
   if(fs.existsSync(dest))fs.copyFileSync(dest,path.join(appFonts,outName));
  }
  return c;
 }]);

 return withDangerousMod(config,["android",async c=>{
  const projectRoot=c.modRequest.projectRoot;
  const appFonts=path.join(projectRoot,"assets","fonts","native");
  fs.mkdirSync(appFonts,{recursive:true});

  for(const [relativePath,outName] of localFonts){
   const source=path.join(projectRoot,relativePath);
   if(fs.existsSync(source))fs.copyFileSync(source,path.join(appFonts,outName));
  }

  for(const [pkg,outName,weight] of expoFonts){
   const source=findTtf(path.join(projectRoot,"node_modules",pkg),weight);
   if(source)fs.copyFileSync(source,path.join(appFonts,outName));
  }

  for(const [url,outName] of remoteFonts){
   const dest=path.join(appFonts,outName);
   if(!fs.existsSync(dest))await download(url,dest);
  }
  return c;
 }]);
};
