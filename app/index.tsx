import {Redirect} from "expo-router";
import {useAuth} from "@/context/AuthContext";
export default function Index(){const {profile,isLoading}=useAuth();if(isLoading)return null;return <Redirect href={profile?.sobriety_date?"/(tabs)":"/onboarding"}/>}