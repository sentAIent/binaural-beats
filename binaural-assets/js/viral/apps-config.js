/**
 * Apps Configuration Registry
 * Define all apps supported by the /viral automation engine
 */
export const APPS_CONFIG = {
    mindwave: {
        id: 'mindwave',
        name: 'MindWave',
        tagline: 'Personal Binaural Beats Studio',
        url: 'https://sentaient.com/mindwave-beta.html',
        demoUrl: 'https://sentaient.com/mindwave-demo.html',
        logo: './mindwave-logo.png',
        primaryColor: '#2dd4bf', // Teal
        topics: ['Focus', 'Sleep', 'Meditation', 'Deep Work', 'Anxiety Relief'],
        scripts: [
            {
                type: 'ugc',
                hook: 'I stopped using coffee for focus and started using frequency.',
                body: 'Using Gamma waves for deep work is a game changer. I get 4 hours of work done in 90 minutes.',
                cta: 'Try it for free at MindWave'
            }
        ],
        visualStyles: ['Matrix', 'Flow', 'Geometric'],
        assets: {
            backgrounds: ['/binaural-assets/images/bg-focus.jpg', '/binaural-assets/images/bg-sleep.jpg'],
            icons: ['🧠', '🌙', '⚡']
        }
    },
    binaural: {
        id: 'binaural',
        name: 'Binaural App',
        tagline: 'Advanced Brainwave Entrainment',
        url: 'https://sentaient.com',
        primaryColor: '#818cf8', // Indigo
        topics: ['Relaxation', 'Study', 'Creativity'],
        assets: {
            backgrounds: [],
            icons: ['🎧', '🌊']
        }
    },
    viral_hub: {
        id: 'viral_hub',
        name: 'Viral Hub',
        tagline: 'Autonomous SaaS Marketing Engine',
        url: 'https://sentaient.com/viral.html',
        logo: '/viral-logo.png',
        primaryColor: '#6366f1', // Indigo/Violet
        topics: ['Automation', 'Marketing', 'ROI', 'Viral Growth', 'UGC Generation'],
        scripts: [
            {
                type: 'ugc',
                hook: 'Stop wasting hours on marketing creative. Let the robot do it.',
                body: 'Viral Hub creates your ad scripts, UGC concepts, and AI visuals in seconds. It is like having a marketing team in a single tab.',
                cta: 'Get Eternity Access to Viral Hub'
            }
        ],
        assets: {
            backgrounds: ['/binaural-assets/images/viral-bg.jpg'],
            icons: ['🚀', '📈', '🤖']
        }
    }
};

export const FALLBACK_APP = APPS_CONFIG.mindwave;
