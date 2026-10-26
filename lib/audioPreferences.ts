import AsyncStorage from "@react-native-async-storage/async-storage";
export const AUDIO_PREFERENCES_KEY="v1ce_audio_preferences";
export type AudioPreferences={musicEnabled:boolean;sfxEnabled:boolean};
export const DEFAULT_AUDIO_PREFERENCES:AudioPreferences={musicEnabled:true,sfxEnabled:true};
export async function loadAudioPreferences():Promise<AudioPreferences>{try{const raw=await AsyncStorage.getItem(AUDIO_PREFERENCES_KEY);if(!raw)return DEFAULT_AUDIO_PREFERENCES;const saved=JSON.parse(raw) as Partial<AudioPreferences>;return{musicEnabled:saved.musicEnabled??true,sfxEnabled:saved.sfxEnabled??true}}catch{return DEFAULT_AUDIO_PREFERENCES}}
export async function saveAudioPreferences(values:Partial<AudioPreferences>):Promise<AudioPreferences>{const next={...DEFAULT_AUDIO_PREFERENCES,...values};await AsyncStorage.setItem(AUDIO_PREFERENCES_KEY,JSON.stringify(next));return next}
