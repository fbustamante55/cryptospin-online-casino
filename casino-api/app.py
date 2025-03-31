from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import json
from typing import Dict, Any

from game_manager import GameManager

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
CORS(app)  # Enable CORS for all routes

# Create game manager
game_manager = GameManager()

# API Routes
@app.route('/api/games', methods=['GET'])
def get_games():
    """Get list of available games."""
    games = game_manager.get_available_games()
    return jsonify(games)

@app.route('/api/game/<game_name>/start', methods=['POST'])
def start_game(game_name):
    """Start a new game session."""
    result = game_manager.create_game(game_name)
    
    if 'error' in result:
        return jsonify(result), 404
        
    return jsonify(result)

@app.route('/api/game/<game_id>/play', methods=['POST'])
def play_game(game_id):
    """Make a move in a game."""
    action = request.json
    
    if not action:
        return jsonify({"error": "No action provided"}), 400
        
    result = game_manager.make_move(game_id, action)
    
    if 'error' in result:
        return jsonify(result), 404
        
    return jsonify(result)

@app.route('/api/game/<game_id>/state', methods=['GET'])
def get_game_state(game_id):
    """Get current state of a game."""
    result = game_manager.get_game_state(game_id)
    
    if 'error' in result:
        return jsonify(result), 404
        
    return jsonify(result)

# Frontend routes
@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files."""
    return send_from_directory('static', path)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Create static and templates directories if they don't exist
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=5001, debug=True)