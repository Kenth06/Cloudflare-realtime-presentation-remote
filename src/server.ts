import { Agent, callable, routeAgentRequest } from "agents";

export interface Slide {
  title: string;
  body: string;
  speakerNotes: string;
}

export interface SlideState {
  currentSlide: number;
  slides: Slide[];
}

const DEMO_SLIDES: Slide[] = [
  {
    title: "Welcome to Cloudflare Agents",
    body: "Building real-time, stateful applications at the edge.\n\nPowered by Durable Objects & the Agents SDK.",
    speakerNotes:
      "Welcome everyone! Today we're going to explore how Cloudflare Agents let you build persistent, real-time applications that run at the edge. This is a game-changer for interactive apps.",
  },
  {
    title: "What Are Agents?",
    body: "Agents are stateful, persistent objects that:\n\n- Maintain state across requests\n- Communicate via WebSocket in real-time\n- Expose RPC methods with @callable()\n- Schedule tasks and run background jobs",
    speakerNotes:
      "Think of Agents as long-lived server-side objects. Unlike traditional serverless functions that are stateless, Agents remember everything. They're built on Durable Objects but with a much friendlier API.",
  },
  {
    title: "Real-Time State Sync",
    body: "setState() does three things:\n\n1. Persists state to SQLite\n2. Broadcasts to all connected clients\n3. Triggers onStateUpdate callbacks\n\nNo manual WebSocket management needed.",
    speakerNotes:
      "This is the magic. When you call setState on the server, it automatically persists to durable storage AND pushes the update to every connected client. No pub/sub setup, no message queues. It just works.",
  },
  {
    title: "The @callable Decorator",
    body: '```typescript\n@callable()\nnext() {\n  this.setState({\n    currentSlide: this.state.currentSlide + 1\n  });\n}\n```\n\nClients call methods via WebSocket RPC.\nType-safe. No REST endpoints needed.',
    speakerNotes:
      "The callable decorator exposes methods to clients over WebSocket. The client gets a typed stub object, so you get full TypeScript autocomplete. No HTTP endpoints, no fetch calls, no serialization boilerplate.",
  },
  {
    title: "React Integration",
    body: '```typescript\nconst agent = useAgent({\n  agent: "PresentationAgent",\n  name: "default",\n  onStateUpdate: (state) => setSlides(state)\n});\n\nagent.stub.next(); // RPC call\n```\n\nOne hook. Full connectivity.',
    speakerNotes:
      "On the client side, the useAgent hook handles WebSocket connection, reconnection, state synchronization, and RPC. You get a stub object with typed methods that map directly to your server's callable methods.",
  },
  {
    title: "Architecture of This Demo",
    body: "Two views, one Agent:\n\n  Display (projector)  <-->  Agent  <-->  Remote (phone)\n       /                  WebSocket           /remote\n\nShared state keeps everything in sync.",
    speakerNotes:
      "This very presentation is the demo! The big screen shows slides, your phone shows speaker notes and controls. Both connect to the same Agent instance via WebSocket. When you tap Next on your phone, the slide advances everywhere instantly.",
  },
  {
    title: "Why Build at the Edge?",
    body: "- Sub-50ms latency worldwide\n- No cold starts with Durable Objects\n- Automatic persistence (SQLite)\n- Built-in WebSocket support\n- Zero infrastructure to manage\n- Scales to millions of connections",
    speakerNotes:
      "The edge advantage is real. Your Agent runs close to your users, so interactions feel instant. Durable Objects don't cold-start like Lambda functions. And you never have to think about databases, scaling, or infrastructure.",
  },
  {
    title: "Get Started Today",
    body: "npm create cloudflare@latest\n\n- Pick the Agents template\n- Write your Agent class\n- Deploy with wrangler deploy\n\nDocs: developers.cloudflare.com/agents\n\nThank you!",
    speakerNotes:
      "Getting started is incredibly easy. The CLI scaffolds everything. You write your Agent class, add some callable methods, and deploy. The Agents SDK handles all the real-time plumbing. Thank you for watching! Questions?",
  },
];

export class PresentationAgent extends Agent<Env, SlideState> {
  initialState: SlideState = {
    currentSlide: 0,
    slides: DEMO_SLIDES,
  };

  @callable()
  next() {
    const max = this.state.slides.length - 1;
    this.setState({
      ...this.state,
      currentSlide: Math.min(this.state.currentSlide + 1, max),
    });
  }

  @callable()
  prev() {
    this.setState({
      ...this.state,
      currentSlide: Math.max(this.state.currentSlide - 1, 0),
    });
  }

  @callable()
  goTo(index: number) {
    const clamped = Math.max(
      0,
      Math.min(index, this.state.slides.length - 1)
    );
    this.setState({
      ...this.state,
      currentSlide: clamped,
    });
  }

  @callable()
  loadSlides(slides: Slide[]) {
    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("slides must be a non-empty array");
    }
    this.setState({
      currentSlide: 0,
      slides,
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    // In production, assets with not_found_handling: "single-page-application"
    // handles SPA routing. In dev, Vite serves the SPA directly.
    return new Response("Not found", { status: 404 });
  },
};
