# Home Assistant Device Reference

Quick reference for all Home Assistant entities on thor (http://thor.localdomain:8123).

## Automations
| Entity ID | Name |
|-----------|------|
| `automation.backup_turn_on_the_lamp` | Backup Turn on the Lamp |
| `automation.office_revolving_4th_of_july_lights` | Office Revolving 4th of July Lights |
| `automation.red_white_and_blue` | Red White and Blue |
| `automation.turn_front_yard_lights_off_at_sunrise` | Turn Front Yard Lights off at Sunrise |
| `automation.turn_front_yard_lights_on_at_sunset` | Turn Front Yard Lights on at Sunset |

## Cameras (Ring)
| Entity ID | Name |
|-----------|------|
| `camera.arcade_room_ring_live_view` | Game Room Ring Camera |
| `camera.back_north_live_view` | Back North Ring Camera |
| `camera.backyard_and_pool_live_view` | Pool Ring Camera |
| `camera.backyard_floodlight_live_view` | Backyard Floodlight Ring Camera |
| `camera.behind_outdoor_kitchen_live_view` | Behind Outdoor Kitchen Ring Camera |
| `camera.driveway_live_view` | Driveway Ring Camera |
| `camera.entryway_live_view` | Entryway Ring Camera |
| `camera.front_north_live_view` | Front North Ring Camera |
| `camera.front_over_landroid_live_view` | Front Over Landroid Ring Camera |
| `camera.front_south_live_view` | Front South Ring Camera |
| `camera.garage_door_live_view` | Garage Door Ring Camera |
| `camera.garden_shed_live_view` | Garden Shed Ring Camera |
| `camera.gate_ring_live_view` | Gate Ring |
| `camera.main_door_live_view` | Main Door |
| `camera.movie_room_live_view` | Movie Room Ring Camera |
| `camera.outside_fireplace_live_view` | Outside Fireplace Ring Camera |
| `camera.side_live_view` | Side Ring Camera |
| `camera.stairway_live_view` | Stairway Ring Camera |
| `camera.west_outdoor_kitchen_live_view` | West Outdoor Kitchen Ring Camera |

## Climate / Thermostats
| Entity ID | Name |
|-----------|------|
| `climate.cs_office_nativezone` | CS Office Thermostat |
| `climate.game_room_nativezone` | Game Room Thermostat |
| `climate.main_nativezone` | Main Thermostat |
| `climate.master_bedroom_nativezone` | Master Bedroom Thermostat |
| `climate.upstairs_nativezone` | Upstairs Thermostat |

## Fans (LeVoit Air Purifiers)
| Entity ID | Name |
|-----------|------|
| `fan.bedroom_levoit` | Master Bedroom LeVoit |
| `fan.living_room_levoit` | Living Room LeVoit |
| `fan.office_levoit` | Office LeVoit |

## Lights
### Indoor
| Entity ID | Name |
|-----------|------|
| `light.living_room` | Living Room |
| `light.master_bedroom` | Master Bedroom |
| `light.master_bedroom_chris_lamp` | Master Bedroom Chris' Lamp |
| `light.master_bedroom_heathers_lamp` | Master Bedroom Heather's Lamp |
| `light.movie_room` | Movie Room |
| `light.hue_color_downlight_1` | Left Movie Room Can Light |
| `light.hue_color_downlight_3` | Right Movie Room Downlight |
| `light.hue_color_downlight_4` | Movie Poster Picture Light |
| `light.hue_color_lamp_2` | Movie Room Ceiling Fan Light 3 |
| `light.hue_color_lamp_3` | Movie Room Ceiling Fan Light 2 |
| `light.hue_color_lamp_4` | Movie Room Ceiling Fan Light 1 |
| `light.hue_play_1` | Right Movie Room Hue Play |
| `light.hue_play_2` | Left Movie Room Hue Play |
| `light.hue_signe_table_2` | Left Movie Room Lamp |
| `light.hue_signe_table_3` | Movie Room Right Signe Lamp |
| `light.office` | Office |
| `light.hue_color_lamp_1_2` | Office Color Light 1 |
| `light.hue_color_lamp_1_3` | Office Color Light 6 |
| `light.hue_color_lamp_1_4` | Office Color Light 2 |
| `light.hue_color_lamp_1_5` | Office Color Light 3 |
| `light.hue_color_lamp_2_2` | Office Color Light 4 |
| `light.hue_color_lamp_3_2` | Office Color Light 5 |
| `light.wine_bar` | Wine Bar |
| `light.hue_color_lamp_5` | Wine Bar Main Light |
| `light.hue_signe_table_1` | Wine Lamp |

### Outdoor
| Entity ID | Name |
|-----------|------|
| `light.backyard` | Backyard |
| `light.front_yard` | Front Yard |
| `light.hue_color_lamp_1` | Front Yard Lamp Post |
| `light.hue_econic_outdoor_wall_1` | Front Yard Left Entryway Light |
| `light.hue_econic_outdoor_wall_1_2` | Front Yard Right Entryway Light |
| `light.hue_outdoor_wall_1` | Left Front Garage Light |
| `light.hue_outdoor_wall_2` | Right Front Garage Light |
| `light.hue_outdoor_wall_3` | Side Floodlight |
| `light.outdoor_kitchen` | Outdoor Kitchen |
| `light.hue_color_downlight_6` | Porch Light |
| `light.hue_color_downlight_5` | Down Light West |
| `light.hue_color_downlight_6_2` | Patio Center Can |
| `light.hue_outdoor_wall_1_2` | Patio Light |
| `light.patio_east_can` | Patio East Can |
| `light.patio_west_can` | Patio West Can |
| `light.hue_econic_outdoor_wall_1_3` | East Patio Ceiling Light |
| `light.west_patio_ceiling_light` | West Patio Ceiling Light |
| `light.pergola_down_light_north` | Pergola Down Light North |
| `light.hue_resonate_outdoor_wall_1` | Pergola Down Light South |
| `light.hue_lightstrip_1` | Hue Lightstrip 1 |

### Ring Camera Lights
| Entity ID | Name |
|-----------|------|
| `light.back_north_light` | Back North Ring Camera Light |
| `light.backyard_and_pool_light` | Pool Ring Camera Light |
| `light.backyard_floodlight_light` | Backyard Floodlight Ring Camera Light |
| `light.front_north_light` | Front North Ring Camera Light |
| `light.front_over_landroid_light` | Front Over Landroid Ring Camera Light |
| `light.front_south_light` | Front South Ring Camera Light |
| `light.garage_door_light` | Garage Door Ring Camera Light |
| `light.west_outdoor_kitchen_light` | West Outdoor Kitchen Ring Camera Light |

## Switches
### Sprinkler Zones (Rachio)
| Entity ID | Name |
|-----------|------|
| `switch.behind_mailbox` | Behind Mailbox |
| `switch.behind_outdoor_kitchen` | Behind Outdoor Kitchen |
| `switch.behind_pool` | Behind Pool |
| `switch.between_driveway_and_fence` | Between Driveway and Fence |
| `switch.between_house_and_driveway` | Between House and Driveway |
| `switch.front_beds` | Front Beds |
| `switch.front_lawn` | Front Lawn |
| `switch.garden_shed` | Garden Shed |
| `switch.hosta_beds` | Hosta Beds |
| `switch.master_bedroom_beds` | Master Bedroom Beds |
| `switch.media_room_beds` | Media Room Beds |
| `switch.rye_schedule` | Rye Schedule |
| `switch.shaded_front_lawn` | Shaded Front Lawn |
| `switch.rachio_prestonwood_rain_delay` | Rachio Rain Delay |
| `switch.rachio_prestonwood_standby` | Rachio Standby |
| `switch.watering_schedule_schedule` | Watering Schedule |

### Thermostat Holds
| Entity ID | Name |
|-----------|------|
| `switch.cs_office_nativezone_hold` | CS Office Thermostat Hold |
| `switch.cs_office_emergency_heat` | CS Office Emergency Heat |
| `switch.game_room_nativezone_hold` | Game Room Thermostat Hold |
| `switch.main_nativezone_hold` | Main Thermostat Hold |
| `switch.master_bedroom_nativezone_hold` | Master Bedroom Thermostat Hold |
| `switch.upstairs_nativezone_hold` | Upstairs Thermostat Hold |

### LeVoit Controls
| Entity ID | Name |
|-----------|------|
| `switch.bedroom_levoit_display` | Master Bedroom LeVoit Display |
| `switch.master_bedroom_levoit_child_lock` | Master Bedroom LeVoit Child Lock |
| `switch.living_room_levoit_child_lock` | Living Room LeVoit Child Lock |
| `switch.living_room_levoit_display` | Living Room LeVoit Display |
| `switch.office_levoit_child_lock` | Office LeVoit Child Lock |
| `switch.office_levoit_display` | Office LeVoit Display |

### Other
| Entity ID | Name |
|-----------|------|
| `switch.automation_hue_dimmer_switch_1` | Hue Dimmer Switch 1 Automation |

## Sensors (Key)
### Thermostat Temperatures
| Entity ID | Name |
|-----------|------|
| `sensor.cs_office_nativezone_temperature` | CS Office Temperature |
| `sensor.game_room_nativezone_temperature` | Game Room Temperature |
| `sensor.main_nativezone_temperature` | Main Temperature |
| `sensor.master_bedroom_nativezone_temperature` | Master Bedroom Temperature |
| `sensor.upstairs_nativezone_temperature` | Upstairs Temperature |

### Thermostat Humidity
| Entity ID | Name |
|-----------|------|
| `sensor.cs_office_humidity` | CS Office Humidity |
| `sensor.game_room_humidity` | Game Room Humidity |
| `sensor.main_humidity` | Main Humidity |
| `sensor.master_bedroom_humidity` | Master Bedroom Humidity |
| `sensor.upstairs_humidity` | Upstairs Humidity |

### Outdoor Temperature
| Entity ID | Name |
|-----------|------|
| `sensor.cs_office_outdoor_temperature` | Outdoor Temperature (via CS Office) |
| `sensor.game_room_outdoor_temperature` | Outdoor Temperature (via Game Room) |
| `sensor.main_outdoor_temperature` | Outdoor Temperature (via Main) |
| `sensor.master_bedroom_outdoor_temperature` | Outdoor Temperature (via Master Bedroom) |
| `sensor.upstairs_outdoor_temperature` | Outdoor Temperature (via Upstairs) |

### Air Quality (LeVoit)
| Entity ID | Name |
|-----------|------|
| `sensor.bedroom_levoit_air_quality` | Master Bedroom Air Quality |
| `sensor.bedroom_levoit_pm2_5` | Master Bedroom PM2.5 |
| `sensor.living_room_levoit_air_quality` | Living Room Air Quality |
| `sensor.living_room_levoit_pm2_5` | Living Room PM2.5 |
| `sensor.office_levoit_air_quality` | Office Air Quality |

### Device Tracking
| Entity ID | Name |
|-----------|------|
| `device_tracker.chris_pierces_iphone` | Chris Pierce's iPhone |
| `device_tracker.escalade` | Escalade |
| `person.chris_pierce` | Chris Pierce |

## Weather
| Entity ID | Name |
|-----------|------|
| `weather.forecast_home` | Forecast Home |
| `weather.kdua` | KDUA |

## Scenes
| Entity ID | Name |
|-----------|------|
| `scene.office_concentrate` | Office Concentrate |
| `scene.office_energize` | Office Energize |
| `scene.office_nightlight` | Office Nightlight |
| `scene.office_read` | Office Read |
| `scene.office_relax` | Office Relax |

## Sirens (Ring)
All Ring cameras have sirens. Pattern: `siren.<location>_siren`

Key sirens: `siren.arcade_room_ring_siren`, `siren.driveway_siren`, `siren.entryway_siren`, `siren.garage_door_siren`, `siren.bedroom_siren` (chime), `siren.laundry_room_siren` (chime)

## API Examples

**IMPORTANT:** Always use `curl -s -X POST` for service calls. Missing `-X POST` or malformed JSON will silently fail — the device won't change but no error is returned. Always verify state after making changes.

```bash
# Get current state of an entity
curl -s -H "Authorization: Bearer $(cat .ha_api-key)" \
  http://thor.localdomain:8123/api/states/climate.main_nativezone | jq

# Turn on a light (basic)
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.office"}' \
  http://thor.localdomain:8123/api/services/light/turn_on

# Set light color (RGB) — always include brightness to ensure light is on
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.office", "rgb_color": [255, 0, 128], "brightness": 255}' \
  http://thor.localdomain:8123/api/services/light/turn_on

# Set light to white by color temperature — use color_temp_kelvin (2000=warm, 6500=cool/bright)
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.office", "color_temp_kelvin": 6500, "brightness": 255}' \
  http://thor.localdomain:8123/api/services/light/turn_on

# Verify light state after changing it
curl -s -H "Authorization: Bearer $(cat .ha_api-key)" \
  http://thor.localdomain:8123/api/states/light.office | jq '.attributes | {brightness, color_temp_kelvin, rgb_color}'

# Turn off a light
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.office"}' \
  http://thor.localdomain:8123/api/services/light/turn_off

# Set thermostat temperature
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.main_nativezone", "temperature": 72}' \
  http://thor.localdomain:8123/api/services/climate/set_temperature

# Activate a scene
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "scene.office_energize"}' \
  http://thor.localdomain:8123/api/services/scene/turn_on
```

### Light Attributes Reference
| Attribute | Type | Range | Notes |
|-----------|------|-------|-------|
| `brightness` | int | 0-255 | Always include when setting color/temp |
| `color_temp_kelvin` | int | 2000-6500 | 2000=warm yellow, 6500=bright cool white |
| `rgb_color` | [R,G,B] | 0-255 each | Sets specific color |
| `hs_color` | [hue, sat] | 0-360, 0-100 | Alternative color format |
