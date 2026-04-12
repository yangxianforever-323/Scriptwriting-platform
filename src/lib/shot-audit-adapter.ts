import type { Shot } from "@/types/storyboard";
import type { SceneDescription } from "@/types/ai";
import type { Character, Location, Prop } from "@/types/story";

export function shotToSceneDescription(
  shot: Shot,
  index: number,
  characters: Character[],
  locations: Location[],
  props: Prop[]
): SceneDescription {
  const location = locations.find(l => l.id === shot.locationId);
  const shotCharacters = characters.filter(c => shot.characterIds?.includes(c.id));
  const shotProps = props.filter(p => shot.propIds?.includes(p.id));

  const locationDesc = location ? `${location.name}${location.atmosphere ? ` (${location.atmosphere})` : ""}` : "";
  const characterDesc = shotCharacters.map(c => c.name).join(", ");
  const propDesc = shotProps.map(p => p.name).join(", ");

  const timeWeather = [shot.lightingType, shot.colorTone].filter(Boolean).join(" ") || undefined;

  return {
    order_index: index,
    description: shot.description || "",
    duration_seconds: shot.duration || undefined,
    location: locationDesc || undefined,
    time_weather: timeWeather,
    image_prompt: shot.imagePrompt || undefined,
    shot_type: shot.shotType || undefined,
    shot_type_name: shot.shotTypeName || undefined,
    camera_movement: shot.cameraMovement || undefined,
    camera_movement_name: shot.cameraMovementName || undefined,
    camera_angle: shot.cameraAngle || undefined,
    lighting_type: shot.lightingType || undefined,
    lighting_name: shot.lightingName || undefined,
    emotion_curve: shot.emotionCurve || undefined,
    dialogue: shot.dialogue || undefined,
    dialogue_timing: shot.dialogueTiming || undefined,
    creative_intent: shot.creativeIntent || undefined,
    film_reference: shot.filmReference || undefined,
    performance_start: shot.performanceStart || undefined,
    performance_action: shot.performanceAction || undefined,
    performance_end: shot.performanceEnd || undefined,
    ambient_sound: shot.ambientSound || undefined,
    action_sound: shot.actionSound || undefined,
    music: shot.music || undefined,
    composition: shot.composition || undefined,
    composition_name: shot.compositionName || undefined,
    depth_of_field: shot.depthOfField || undefined,
    depth_of_field_name: shot.depthOfFieldName || undefined,
    foreground: shot.foreground || undefined,
    background: shot.background || undefined,
    color_tone: shot.colorTone || undefined,
    light_source: shot.lightSource || undefined,
    light_position: shot.lightPosition || undefined,
    light_quality: shot.lightQuality || undefined,
    focal_length: shot.focalLength || undefined,
    subject_position: shot.subjectPosition || undefined,
  };
}

export function shotsToSceneDescriptions(
  shots: Shot[],
  characters: Character[],
  locations: Location[],
  props: Prop[]
): SceneDescription[] {
  return shots.map((shot, index) =>
    shotToSceneDescription(shot, index, characters, locations, props)
  );
}
