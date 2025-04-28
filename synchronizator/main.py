import os
import tornado.ioloop
import tornado.web
import socketio
from typing import List, Any
import json

PORT = int(os.environ.get('TORNADO_PORT', 8888))
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'
PRODUCTION = os.environ.get('PRODUCTION', 'false').lower() == 'true'
SERVER_USERNAME = os.environ.get('SERVER_USERNAME', '')
SERVER_PASSWORD = os.environ.get('SERVER_PASSWORD', '')
GAME_SAVE_FILE = os.path.join(os.path.dirname(__file__), 'data/game_save.json')
BUFFER_SIZE = int(os.environ.get('BUFFER_SIZE', 1)) # in MB

subscribers: List[str] = []
"""List of SIDs of all connected clients which are just watching."""
controllers: List[str] = []
"""List of SIDs of all connected clients which want to send the data. Only the the first one can!"""
game: dict[str, Any] = {}
"""Game state."""

def load_game_state() -> dict[str, Any]:
    """Load game state from file if it exists."""
    try:
        os.makedirs(os.path.dirname(GAME_SAVE_FILE), exist_ok=True)
        if os.path.exists(GAME_SAVE_FILE):
            with open(GAME_SAVE_FILE, 'r') as f:
                loaded_game = json.load(f)
                print(f"📂 Loaded game state from {GAME_SAVE_FILE}")
                return loaded_game
        else:
            print(f"📂 No game state file found at {GAME_SAVE_FILE}")
            return dict()
    except Exception as e:
        print(f"❌ Error loading game state: {e}")
        return dict()

def save_game_state(game: dict[str, Any]):
    """Save current game state to file."""
    try:
        with open(GAME_SAVE_FILE, 'w') as f:
            json.dump(game, f, indent=2)
        print(f"💾 Saved game state to {GAME_SAVE_FILE}")
    except Exception as e:
        print(f"❌ Error saving game state: {e}")


class IndexHandler(tornado.web.RequestHandler):
    """Basic health check endpoint."""
    def get(self):
        self.set_status(200)
        self.write("OK")


class RestartHandler(tornado.web.RequestHandler):
    """Handler for restarting the game."""
    async def get(self):
        username = self.get_argument('username', '')
        password = self.get_argument('password', '')
        print(f"🔑 username={username}, password={password}, expected_username={SERVER_USERNAME}, expected_password={SERVER_PASSWORD}")
        if username != SERVER_USERNAME or password != SERVER_PASSWORD:
            print(f"-- ❌ failed to authenticate")
            self.set_status(401)
            self.write("Unauthorized")
            return
        print(f"-- ✅ authenticated")
        global game
        old_game = game
        game = {}
        save_game_state(game)
        await sio.emit('game', game)
        self.write(f"<h1>⚰️ RIP Old Game:</h1><pre>{old_game}</pre>")


class DevHandler(tornado.web.RequestHandler):
    """Handler for dev.html which contains a simple UI for development purposes.
    Should be removed before deploying.
    """
    def get(self):
        with open(os.path.join(os.path.dirname(__file__), 'dev.html'), 'r') as f:
            self.write(f.read())


# SocketIO server instance
sio = socketio.AsyncServer(
    async_mode='tornado',
    cors_allowed_origins="*",
    logger=DEBUG,
    engineio_logger=DEBUG,
    max_http_buffer_size=BUFFER_SIZE * 1000 * 1000,
)

routes = [
    (r'/', IndexHandler),
    (r'/restart', RestartHandler),
    (r'/socket.io/', socketio.get_tornado_handler(sio)),
]
if not PRODUCTION:
    routes.append((r'/dev', DevHandler))
app = tornado.web.Application(routes) # type: ignore


@sio.event
async def connect(sid, environ):
    global game
    print(f"✅ client connected: {sid}")
    subscribers.append(sid)
    if len(controllers) > 0:
        controller = controllers[0]
    else:
        controller = None
    
    await sio.emit('controller', {'controller_id': controller}, room=sid)
    await sio.emit('game', game, room=sid)


@sio.event
async def disconnect(sid):
    global subscribers, controllers
    if sid in subscribers:
        print(f"❌ subscriber removed: {sid}")
        subscribers.remove(sid)
    
    if sid in controllers[1:]:
        print(f"❌ waiting controller removed: {sid}")
        controllers.remove(sid)
        
    if len(controllers) > 0 and sid == controllers[0]:
        print(f"👑 main controller removed: {sid}")
        controllers.remove(sid)
        if len(controllers) == 0: # No controllers left, inform all subscribers
            print("   -> 🪑 no controller left")
            await sio.emit('controller', {'controller_id': None})
        else: # Immediately assign NEW MAIN CONTROLLER
            print(f"   -> 👑 new main controller: {controllers[0]}")
            await sio.emit('controller', {'controller_id': controllers[0]})

    await sio.emit('disconnected', {'id': sid})
    if sid not in controllers:
        return
    
    # Emit warning to those who are waiting for the controller role
    for i, controller in enumerate(controllers):
        if i == 0:
            continue
        await sio.emit('warning', {'message': f'Waiting for controller role, {i} in front of you'}, room=controller)


@sio.event
async def request_controller_role(sid):
    """Event handler for clients requesting controller role. Only one controller is allowed.
    TODO: Implement a queue of waiting subscribers for the controller role.
    """
    global controllers, subscribers
    # NOT EXPECTED
    if sid in controllers:
        print(f"🚫 already in controller queue with id {sid}")
        await sio.emit('error', {'message': 'Already in controller queue'}, room=sid)
        return

    # NEW KING OF THE HILL
    if len(controllers) == 0:
        print(f"👑 controller role assigned to: {sid}")
        if sid in subscribers:
            subscribers.remove(sid)
        controllers.append(sid)
        await sio.emit('controller', {'controller_id': sid})
        return

    # ADD TO QUEUE - is not present, is not the first so we add to the end
    print(f"⏳ adding {sid} to controllers queue")
    controllers.append(sid)
    position = len(controllers) - 1
    await sio.emit('warning', {'message': f'Waiting for controller role, {position} in front of you'}, room=sid)


@sio.event
async def message(sid, data):
    """Event handler for message data updates - only controllers can send message data."""
    global controllers

    # NOT EXPECTED
    if sid != controllers[0]:
        print(f"🚫 data update rejected from non-controller {sid}")
        await sio.emit('error', {'message': 'Only first controller can send data!'}, room=sid)
        return

    # DISTRIBUTE DATA
    print(f"🔄 received message data from controller {sid}: {data}")
    lookers = subscribers + controllers[1:]
    await sio.emit('message', data, room=lookers)

@sio.event
async def save_game(sid, data: dict[str, Any]):
    """Event handler for game save data - only controllers can send game save data."""
    global game, controllers
    if sid != controllers[0]:
        print(f"🚫 save game rejected from non-controller {sid}")
        await sio.emit('error', {'message': 'Only first controller can save game!'}, room=sid)
        return

    print(f"💾 received game save from controller {sid}: {data}")
    game = data
    save_game_state(game)
    # TODO: distribute game save to all subscribers?
    # await sio.emit('game', game, room=controllers[1:])

if __name__ == "__main__":
    game = load_game_state()  # This will set the global game variable 
    print("🎮 game data:", game)
    app.listen(PORT)
    print(f"🚀 Tornado server started on http://127.0.0.1:{PORT}/")
    tornado.ioloop.IOLoop.current().start()
