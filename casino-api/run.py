from app import app

if __name__ == '__main__':
    # Use threaded=True for better performance
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)