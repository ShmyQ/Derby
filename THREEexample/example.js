var socket = io.connect("http://localhost:8888");

function sendSphere(){
    socket.emit("sendSphere", g.sphere.position);
    console.log("sent sphere");
}
$(document).ready(function() {
    init();
    animate();
    socket.on("receiveSphere", function (data) {
        console.log("sphere?");
        if(data.player) {
        console.log("receiving sphere");
          // Sphere
          if(g.enemies[data.player]){
            g.enemies[data.player].position = data.position;
          }
          else {
            var enemySphere = new THREE.Mesh(new THREE.SphereGeometry(c.SPHERE_SIZE,c.SPHERE_SIZE,c.SPHERE_SIZE), new THREE.MeshLambertMaterial({
            color: c.ENEMY_COLOR
            }));
            enemySphere.overdraw = true;
            g.enemies[data.player] = enemySphere;
            g.enemies[data.player].position = data.position;
            g.scene.add(enemySphere);
          }
        }
    });
    
    setInterval(sendSphere,1);
});

// Globals
var g = {
    scene: null,
    camera: null,
    renderer: null,
    stats: null,
    keyboard: new THREEx.KeyboardState(),
    clock: new THREE.Clock(),
    sphere: null,
    jumping: false,
    falling: false,
    currentJumpHeight: 0,
    currentMoveSpeed: {forward: 0,left: 0},
    decelerateCount: 0,
    bounceCounter: 0,
    enemies: [],
};


// Constants
var c = {
    // META
    SCREEN_WIDTH: window.innerWidth, 
    SCREEN_HEIGHT: window.innerHeight,
    BG_COLOR: 0xEEEEEE,
    
    // JUMP
    MAX_JUMP_HEIGHT: [120,48,24,12,6], // ARRAY for each bounce
    JUMP_SPEED: 6,
    
    // CAMERA
    VIEW_ANGLE: 70,
    ASPECT: window.innerWidth / window.innerHeight,
    NEAR: 0.1, 
    FAR: 20000,
    CAM_X_OFFSET: 0,
    CAM_Y_OFFSET: 50,
    CAM_Z_OFFSET: 200,
    
    // SPHERE
    SPHERE_SIZE: 50,
    SPHERE_COLOR: 0x00ff00,
    ACCEL_SPEED: 1,
    MAX_MOVE_SPEED: 8,
    DECELERATE_INTERVAL: 7, // How many keyPress() checks before actually decelerating
    BOUNCE_COUNT: 3,
    
    // FLOOR
    FLOOR_SIZE: 1000,
    FLOOR_COLOR: 0x0000FF,
    FLOOR_Y_OFFSET: -45,
    FLOOR_REPEATS: 2,
    FLOOR_COLOR_1: 0xff0000,
    FLOOR_COLOR_2: 0x00ff00,
    FLOOR_COLOR_3: 0x0000ff,  
    
    //LIGHT
    LIGHT_POSITION: 100,
    LIGHT_COLOR: 0xffffff,
    
    //ENEMY
    ENEMY_COLOR: 0xff0000,
    
    
};

function init(){
    //--------------------------
    // Create Renderer and Env.
    //--------------------------
 
	if ( Detector.webgl )
		g.renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		g.renderer = new THREE.CanvasRenderer(); 
        
	g.renderer.setSize(c.SCREEN_WIDTH, c.SCREEN_HEIGHT);
    
	document.body.appendChild(g.renderer.domElement);
    
    g.renderer.setClearColorHex(c.BG_COLOR, 1.0);
    g.renderer.clear();
    
    // STATS
	g.stats = new Stats();
	g.stats.domElement.style.position = 'absolute';
	g.stats.domElement.style.bottom = '0px';
	g.stats.domElement.style.zIndex = 100;
    document.body.appendChild(g.stats.domElement );
	
	// Initialize Physics
	Physijs.scripts.worker = '/THREEexample/physijs_worker.js';
	Physijs.scripts.ammo = '/THREEexample/ammo.js';
    
    //--------------------------
    // Create Scene / Objects
    //--------------------------
    g.scene = new Physijs.Scene();
    
    //Camera
	g.camera = new THREE.PerspectiveCamera(c.VIEW_ANGLE,c.ASPECT,c.NEAR,c.FAR);
	g.scene.add(g.camera);
	g.camera.lookAt(g.scene.position);
    
    // Sphere
    g.sphere = new Physijs.SphereMesh(new THREE.SphereGeometry(c.SPHERE_SIZE,c.SPHERE_SIZE,c.SPHERE_SIZE), new THREE.MeshLambertMaterial({
        color: c.SPHERE_COLOR
    }));
    g.sphere.overdraw = true;
    g.scene.add(g.sphere);
    
 
    // Add directional light sources
    var directionalLight1 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight1.position.set(c.LIGHT_POSITION, c.LIGHT_POSITION, c.LIGHT_POSITION).normalize();
    g.scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight2.position.set(-c.LIGHT_POSITION, c.LIGHT_POSITION, c.LIGHT_POSITION).normalize();
    g.scene.add(directionalLight2);
    
    var directionalLight3 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight3.position.set(c.LIGHT_POSITION, c.LIGHT_POSITION, -c.LIGHT_POSITION).normalize();
    g.scene.add(directionalLight3);
    
    var directionalLight4 = new THREE.DirectionalLight(c.LIGHT_COLOR);
    directionalLight4.position.set(-c.LIGHT_POSITION, c.LIGHT_POSITION, -c.LIGHT_POSITION).normalize();
    g.scene.add(directionalLight4);

    // Floor
    // geometrical layout
    var geometry = new THREE.PlaneGeometry(c.FLOOR_SIZE, c.FLOOR_SIZE, c.FLOOR_REPEATS, c.FLOOR_REPEATS);

    // materials
    var materials = []; 
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_1}));
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_2}));
    materials.push(new THREE.MeshBasicMaterial({ color: c.FLOOR_COLOR_3}));

    // assign a material to each face
    for( var i = 0; i < geometry.faces.length; i++ ) {
        geometry.faces[i].materialIndex = (i%3);
    }
	
    // Create plane
    var plane = new Physijs.PlaneMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    plane.rotation.x = -Math.PI/2;
    plane.position.y = c.FLOOR_Y_OFFSET;
    plane.receiveShadow = true;
    g.scene.add(plane);
	
}

//--------------------------
// Update and Render
//--------------------------
function render() {
	g.scene.simulate();
	g.renderer.render(g.scene, g.camera);
}

function update() {
    checkKeyPress();
    checkMoveState();
    adjustCamera();
	g.stats.update();
    
}

//--------------------------
// Animations
//--------------------------
function animate() {
    requestAnimationFrame(animate);
	render();		
	update();
}

function adjustCamera(){
    var delta = g.clock.getDelta(); // seconds.
    var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
    // rotate left/right/up/down
	var rotation_matrix = new THREE.Matrix4().identity();
	if (g.keyboard.pressed("A"))
		rotation_matrix = new THREE.Matrix4().makeRotationY(rotateAngle);
	if (g.keyboard.pressed("D"))
		rotation_matrix = new THREE.Matrix4().makeRotationY(-rotateAngle);

	if (g.keyboard.pressed("A") || g.keyboard.pressed("D")){
		g.sphere.matrix.multiply(rotation_matrix);
		g.sphere.rotation.setEulerFromRotationMatrix(g.sphere.matrix);
	}
    
	var relativeCameraOffset = new THREE.Vector3(c.CAM_X_OFFSET,c.CAM_Y_OFFSET,c.CAM_Z_OFFSET);
	var cameraOffset = relativeCameraOffset.applyMatrix4(g.sphere.matrixWorld);

	g.camera.position.x = cameraOffset.x;
	g.camera.position.z = cameraOffset.z;
    g.camera.position.y = cameraOffset.y;
	g.camera.lookAt(g.sphere.position);
}

// Key press handler
function checkKeyPress(){
    
    var accelerateLeft = false;
    var accelerateForward = false;
    
	// Movement
	if(g.keyboard.pressed("W")){
         if(g.currentMoveSpeed.forward > -c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.forward -= c.ACCEL_SPEED;
            accelerateForward = true;
         }
    }
	if(g.keyboard.pressed("S")){
        if(g.currentMoveSpeed.forward < c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.forward += c.ACCEL_SPEED;
            accelerateForward = true;
        }
       
    }
	if(g.keyboard.pressed("Q")){
        if(g.currentMoveSpeed.left > -c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.left -= c.ACCEL_SPEED;
            accelerateLeft = true;
        }
        
    }
	if(g.keyboard.pressed("E")){
        if(g.currentMoveSpeed.left < c.MAX_MOVE_SPEED){
            g.currentMoveSpeed.left += c.ACCEL_SPEED;
            accelerateLeft = true;
        }
       
    }
    // Deceleration
    if(g.decelerateCount < c.DECELERATE_INTERVAL){
        g.decelerateCount++;
    }
    
    else {
        g.decelerateCount = 0;
        if(accelerateForward === false){
            decelerateForward();
        }
        if(accelerateLeft === false){
            decelerateLeft();
        }
    }
    
    // Jump
    if(g.keyboard.pressed("space")){
        if(g.jumping === false && g.falling === false)
            jump();
    }
   
    
    
}

// Updates the sphere's movement in X and Z
function checkMoveState(){    
    g.sphere.translateZ(g.currentMoveSpeed.forward);
    g.sphere.translateX(g.currentMoveSpeed.left);
    
    // Check Y movement
    checkJumpState();
}

// Sets the sphere to be jumping
function jump() {
    g.jumping = true;
}

// Updates the sphere's Y movement
function checkJumpState(){
    // Going up
    if(g.jumping === true){
        // Keep going up
        if(g.currentJumpHeight < c.MAX_JUMP_HEIGHT[g.bounceCounter]){
            g.sphere.translateY(c.JUMP_SPEED);
            g.camera.translateY(c.JUMP_SPEED);
            g.currentJumpHeight+= c.JUMP_SPEED;
        }
		
        // Start falling
        else if(g.currentJumpHeight >= c.MAX_JUMP_HEIGHT[g.bounceCounter]){
            g.jumping = false;
            g.falling = true;
        }
        
        else {
            console.log("ERROR ON JUMP")
        }
    }
    
    // Going down
    if(g.falling === true){
        // Keep falling
        if(g.currentJumpHeight > 0){
            g.sphere.translateY(-c.JUMP_SPEED);
            g.camera.translateY(-c.JUMP_SPEED);
            g.currentJumpHeight-= c.JUMP_SPEED;
        }
        // Stop falling
        else if(g.currentJumpHeight === 0){
            // Bounce
            if(g.bounceCounter < c.BOUNCE_COUNT){
                g.jumping = true;
                g.bounceCounter++;
                g.falling = false;
            }
            // Stop
            else {
                g.falling = false;
                g.bounceCounter = 0;
            }
        }
        
        else {
            console.log("ERROR ON FALL");
        }
    }
}

// Decreases sphere movespeed forward/backward
function decelerateForward(){
    if(g.currentMoveSpeed.forward > 0)
         g.currentMoveSpeed.forward--;
    if(g.currentMoveSpeed.forward < 0)
        g.currentMoveSpeed.forward++;
}

// Decreases sphere movespeed left/right
function decelerateLeft(){
    if(g.currentMoveSpeed.left > 0)
         g.currentMoveSpeed.left--;
    if(g.currentMoveSpeed.left < 0)
         g.currentMoveSpeed.left++;
}






