# Weather System Documentation

## Overview
A dynamic weather system has been added to Ocean Ascent that changes the background sky, adds atmospheric effects, and creates an immersive environment.

## Features

### Weather Types
The system includes 5 different weather conditions:

1. **☀ Clear** - Bright sunny day with light clouds
   - Sky: Bright blue gradient
   - Cloud opacity: 30%
   - No particles

2. **☁ Cloudy** - Overcast with more clouds
   - Sky: Gray-blue gradient
   - Cloud opacity: 70%
   - Slower cloud movement

3. **🌧 Rainy** - Rain falling from the sky
   - Sky: Dark gray gradient
   - Rain particle effects
   - Water tint overlay
   - Cloud opacity: 90%

4. **⛈ Stormy** - Heavy rain with lightning
   - Sky: Very dark gradient
   - Heavy rain particles (3x intensity)
   - Lightning flashes
   - Strong water tint
   - Fast-moving clouds

5. **🌫 Foggy** - Misty atmosphere
   - Sky: Light gray gradient
   - Fog particle effects
   - Slow cloud movement
   - Light water tint

## How to Use

### Manual Control
A weather control panel is located in the top-right corner of the screen with buttons for each weather type. Click any button to instantly transition to that weather.

### Automatic Weather Changes
By default, the weather automatically changes every 30 seconds (1800 frames at 60fps) to a random weather type. This creates a dynamic, ever-changing environment.

### Programmatic Control
You can control the weather from the browser console or your code:

```javascript
// Set specific weather
window.setWeather('rainy');
window.setWeather('stormy');
window.setWeather('clear');

// Access the weather system directly
import { WeatherSystem } from './environment.js';

// Change weather
WeatherSystem.setWeather('cloudy');

// Cycle through weather types
WeatherSystem.cycleWeather();

// Random weather
WeatherSystem.randomWeather();

// Disable auto-weather changes
WeatherSystem.weatherDuration = Infinity;

// Change transition speed (frames)
WeatherSystem.transitionDuration = 600; // Slower transition
```

## Technical Details

### Integration Points

1. **environment.js** - Core weather system logic
   - Weather state management
   - Particle systems (rain, fog)
   - Color interpolation
   - Weather effects rendering

2. **render_map.js** - Sky rendering integration
   - `drawSky()` now uses weather colors
   - Dynamic cloud rendering

3. **main.js** - Game loop integration
   - Weather system updates every frame
   - Weather effects drawn after all game objects
   - UI display updates

4. **index.html** - UI controls
   - Weather control panel
   - Current weather display

### Weather Transitions
Weather changes smoothly over 300 frames (5 seconds at 60fps) by default. The system interpolates:
- Sky colors (top and bottom gradients)
- Cloud opacity and speed
- Particle effects
- Water tint overlays

### Performance
- Rain particles are capped at 300 maximum
- Fog uses 50 pre-initialized particles
- Particle systems only active when needed
- Efficient color interpolation

## Customization

### Adding New Weather Types
Edit `environment.js` and add to the `weatherTypes` object:

```javascript
weatherTypes: {
    // ... existing types ...
    snowy: {
        skyTop: '#d0d8e0',
        skyBot: '#a0b0c0',
        particles: 'snow',  // You'd need to implement this
        cloudOpacity: 0.8,
        cloudSpeed: 0.4,
        waterTint: 'rgba(200, 210, 220, 0.2)'
    }
}
```

### Adjusting Auto-Change Timing
In `environment.js`, modify:
```javascript
weatherDuration: 1800, // Change this value (in frames)
```

### Customizing Transition Speed
In `environment.js`, modify:
```javascript
transitionDuration: 300, // Change this value (in frames)
```

## Visual Effects

### Rain
- Individual rain drops with varying speeds and lengths
- Slight wind effect (horizontal movement)
- Opacity variation for depth

### Fog
- Large elliptical fog particles
- Horizontal scrolling movement
- Layered opacity for atmospheric depth

### Lightning
- Random flashes during stormy weather
- White screen overlay with fade-out
- Occurs every ~2 seconds during storms

### Clouds
- Procedurally generated cloud puffs
- Parallax scrolling based on weather
- Dynamic opacity based on weather type

## Future Enhancements
Potential additions:
- Snow particles for winter weather
- Wind effects on water waves
- Weather-based fish behavior
- Sound effects for rain/thunder
- Time-of-day system integration
- Weather forecast system
- Seasonal weather patterns
