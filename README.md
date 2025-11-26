# Video Training Application

A professional, responsive video training application built with Next.js and Material UI, optimized for 1920x1080 resolution.

## Features

- **Professional Video Player**: Custom video player with full controls (play/pause, seek, volume, fullscreen)
- **Interactive Quizzes**: Dynamic quiz system with timer and progress tracking
- **Results Dashboard**: Comprehensive results screen with confetti animation
- **Responsive Design**: Optimized for 1920x1080 resolution with adaptive scaling
- **Modern UI**: Clean, professional interface using Material UI components
- **Single Page Application**: Dynamic component switching without page reloads

## Technology Stack

- **Next.js 14** - React framework with App Router
- **Material UI (MUI)** - Professional UI component library
- **Canvas Confetti** - Celebration animations
- **CSS3** - Custom styling and animations

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── VideoPlayer.js      # Video player with custom controls
│   │   ├── QuizComponent.js    # Interactive quiz interface
│   │   └── ResultsScreen.js    # Results dashboard with animations
│   ├── globals.css             # Global styles and responsive design
│   ├── layout.js               # Root layout with theme provider
│   ├── page.js                 # Main application component
│   └── theme.js                # Material UI theme configuration
├── data/
│   └── trainingData.js         # Training content and quiz data
├── package.json
├── next.config.js
└── README.md
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Application Flow

1. **Home Screen**: Browse available training videos
2. **Video Player**: Watch training content with full controls
3. **Quiz Interface**: Answer questions with timer and progress tracking
4. **Results Screen**: View comprehensive results with confetti animation
5. **Navigation**: Seamless flow between components

## Key Features

### Video Player
- Custom video controls overlay
- Seek bar with click-to-seek functionality
- Volume control with mute toggle
- Fullscreen support
- Auto-hide controls with mouse interaction

### Quiz System
- Multiple choice questions
- 30-second timer per question
- Progress tracking with visual indicators
- Immediate feedback and navigation
- Score calculation and storage

### Results Dashboard
- Overall score calculation
- Detailed performance breakdown
- Confetti animation for completion
- Performance categorization
- Action buttons for navigation

### Responsive Design
- Optimized for 1920x1080 resolution
- Adaptive typography scaling
- Professional color scheme
- Smooth animations and transitions
- Accessibility features

## Customization

### Adding New Videos
Edit `data/trainingData.js` to add new videos and corresponding quiz questions:

```javascript
{
  id: 3,
  title: "Your Video Title",
  description: "Video description",
  videoUrl: "path/to/video.mp4",
  duration: "15:30",
  thumbnail: "path/to/thumbnail.jpg"
}
```

### Modifying Quiz Questions
Add questions to the corresponding video quiz:

```javascript
{
  id: 7,
  question: "Your question here?",
  options: [
    "Option A",
    "Option B", 
    "Option C",
    "Option D"
  ],
  correctAnswer: 0 // Index of correct answer
}
```

### Theme Customization
Modify `app/theme.js` to customize colors, typography, and component styles.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

- Optimized for 1920x1080 resolution
- Efficient component rendering
- Smooth animations with hardware acceleration
- Responsive design for various screen sizes

## License

This project is open source and available under the MIT License.
