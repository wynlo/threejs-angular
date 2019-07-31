import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, HostListener } from '@angular/core';

import * as THREE from 'three';
import "./EnableThreeExamples";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import SpriteText from 'three-spritetext';

@Component({
  selector: 'app-lift',
  templateUrl: './lift.component.html',
  styleUrls: ['./lift.component.css']
})
export class LiftComponent implements OnInit {

  constructor() {
    this.render = this.render.bind(this);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.camera = null
    this.scene = null;
    this.renderer = null;
    this.raycaster = null;
  }

  //*********************************************************************
  @ViewChild('rendererContainer', { static: false }) rendererContainer: ElementRef;
  //Scene Startup (Main)
  renderer = null;
  scene = null;
  camera = null;
  raycaster = null;
  controls = null;
  manager = null;
  mesh = null;
  plane = null;
  building = null;


  //Functionality
  loaded = false;
  buildinghidden = false;
  popuphelp = null;

  //Lift Configuration
  liftcount = Math.floor(Math.random() * 4) + 1;

  //Text Labels and Sensor Data
  currentlabel = null;

  cardata = {
    0: {
      'position': 'Retrieving...',
      'vibration': 'Retrieving...'
    },
    1: {
      'position': 'Retrieving...',
      'vibration': 'Retrieving...'
    },
    2: {
      'position': 'Retrieving...',
      'vibration': 'Retrieving...'
    },
    3: {
      'position': 'Retrieving...',
      'vibration': 'Retrieving...'
    }
  };


  motordata = {
    0: {
      'current': 'Retrieving...',
      'status': null,
      'signal': null
    },
    1: {
      'current': 'Retrieving...',
      'status': null,
      'signal': null
    },
    2: {
      'current': 'Retrieving...',
      'status': null,
      'signal': null
    },
    3: {
      'current': 'Retrieving...',
      'status': null,
      'signal': null
    }
  };


  // id corresponds to index
  liftData = ['lift-A', 'lift-B', 'lift-C', 'lift-D']


  //Raycasting
  mousex = null;
  mousey = null;
  interactables = null;
  highlightGroup = null;
  parentid = null;
  componentSelected = 'None';

  camindicator = null;


  // Resize Window Event Listener =============================================================================================================================
  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {

    var divWidth = document.getElementById("rendererContainer").offsetWidth;
    console.log(divWidth);
    this.camera.aspect = divWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(divWidth, window.innerHeight);
    this.controls.update();
  }

  // ==========================================================================================================================================================

  @HostListener('document:mousemove', ['$event'])
  OnMouseMove(event) {
    //console.log(event);
    if (this.loaded == true) {
      event.preventDefault();

      var rect = this.renderer.domElement.getBoundingClientRect();
      this.mousex = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
      this.mousey = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;


      this.checkIntersect();
      var element = document.getElementById("rendererContainer");
      if (this.componentSelected != 'None') {
        element.style.cursor = "crosshair";
      }

      else {
        element.style.cursor = "auto";
      }

      this.render();
    }
  }



  // MouseClick Event Listener ===============================================================================================================================

  @HostListener('contextmenu', ['$event'])
  StopContextMenu(event) {
    event.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  OnMouseDown(event) {
    if (this.loaded == true) {

      event.preventDefault();
      var rect = this.renderer.domElement.getBoundingClientRect();

      this.mousex = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
      this.mousey = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

      if (event.which === 1) { // leftClick


        this.moveCameraLocation(); //Check if clicked on lift
        this.render();

      }


    }
  }


  // Raycast MouseHover =========================================================================================================================================


  checkIntersect() {
    var scope = this;
    if (this.scene != null && this.raycaster != null) {
      var mouse = new THREE.Vector2(this.mousex, this.mousey), INTERSECTED;
      this.raycaster.setFromCamera(mouse, this.camera);

      var intersects = this.raycaster.intersectObjects(this.interactables, true);
      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          INTERSECTED = intersects[0].object;

          if (INTERSECTED.parent.name.includes("__component__") && !INTERSECTED.parent.name.includes("__highlight_group__")) {

            // Remove all existing highlights =========================================================


            if (this.highlightGroup != null) {
              this.highlightGroup.parent.remove(this.highlightGroup);
              this.highlightGroup = null;
            }

            //Remove all Labels ------------------
            this.scene.remove(this.currentlabel);
            this.currentlabel = null;
            //Remove all Labels ------------------

            // Remove all existing highlights =========================================================

            var parent = INTERSECTED.parent;
            //console.log(parent);

            var temp = parent.name.split('-');

            this.parentid = temp[temp.length - 1];
            this.componentSelected = INTERSECTED.parent.name.replace("__component__", "").split("-")[0].replace("_", " ").replace("_", " ");


            // Make Labels Appear ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


            if (this.componentSelected.includes("car")) {


              this.scene.remove(this.currentlabel); // Remove old label

              var car = this.scene.getObjectByName("__component__car-" + this.parentid); // Get Label reference component

              var position = this.cardata[this.parentid]['position'];
              var vibration = this.cardata[this.parentid]['vibration'];

              var positionText = "Position: " + position;
              var vibrationText = "Vibration: " + vibration;

              this.currentlabel = new THREE.Group();

              var positionLabel = new SpriteText(positionText, 1.6, '#000', 'Arial', 150);
              positionLabel.position.set(car.position.x, car.position.y, car.position.z - 15);
              this.currentlabel.add(positionLabel);

              var vibrationLabel = new SpriteText(vibrationText, 1.6, "#000", 'Arial', 150);
              vibrationLabel.position.set(car.position.x, car.position.y - 3.2, car.position.z - 15);
              this.currentlabel.add(vibrationLabel);

              this.currentlabel.name = "__text__car-" + this.parentid;

              this.scene.add(this.currentlabel);

            }


            if (this.componentSelected.includes("electric motor")) {

              this.scene.remove(this.currentlabel); // Remove old label

              var motor = this.scene.getObjectByName("__component__electric_motor-" + this.parentid); // Get Label reference component

              var currentText = "⚡ Current: " + this.motordata[this.parentid]['current'];
              var status = this.motordata[this.parentid]['status'];
              if (status == null) { var color = '#000' }
              else if (status == 'Danger') { var color = '#ff0000' }
              else if (status == 'Warning') { var color = '#ffa500' }
              else if (status == 'Normal') { var color = '#228b22' }

              this.currentlabel = new SpriteText(currentText, 1.6, color, 'Arial', 100);
              this.currentlabel.name = "__text__electric_motor-" + this.parentid;

              this.currentlabel.position.z = motor.position.z + 0;
              this.currentlabel.position.y = motor.position.y + 34;
              this.currentlabel.position.x = motor.position.x + 0;

              this.scene.add(this.currentlabel);



            }



            // Make Labels Appear ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++





            // Construct new highlight =========================================================

            if (this.highlightGroup == null) {
              var group = new THREE.Group;

              parent.children.forEach(function (child) {

                if (!child.name.includes("__highlight_group__")) {


                  try {
                    var geo = new THREE.EdgesGeometry(child.geometry, 1);
                    var mat = new THREE.LineBasicMaterial({ color: 0x00FFFF, linewidth: 1, linejoin: 'bevel' });
                    var highlight = new THREE.LineSegments(geo, mat);
                    highlight.scale.set(1.015, 1.015, 1.015);
                    highlight.name = "__highlight__" + child.name;
                    group.add(highlight);

                  } catch (error) { }


                }

              })


              group.name = "__highlight_group__" + parent.name;
              parent.add(group);
              scope.highlightGroup = group;

              // Construct new highlight =========================================================
            }
          }
        }
      } else {
        // If there are no intersects =========================================================

        INTERSECTED = null;
        this.componentSelected = 'None';
        if (this.highlightGroup != null) {
          this.highlightGroup.parent.remove(this.highlightGroup);
        }

        this.highlightGroup = null;

        //Remove all Labels ------------------
        this.scene.remove(this.currentlabel);
        this.currentlabel = null;
        //Remove all Labels ------------------

        // If there are no intersects =========================================================
      }
    }
  }

  // Raycast MouseHover =========================================================================================================================================

  //=======================================================================================================================================



  // MOVE CAMERA POSITION ======================================================================================================================


  moveCameraLocation() {

    if (this.scene != null && this.raycaster != null) {

      if (this.camindicator != null) {
        this.scene.remove(this.camindicator);
        this.camindicator = null;
      }

      var mouse = new THREE.Vector2(this.mousex, this.mousey), INTERSECTED;
      this.raycaster.setFromCamera(mouse, this.camera);

      var intersects = this.raycaster.intersectObjects(this.interactables, true);
      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          INTERSECTED = intersects[0].object;

          if (INTERSECTED.parent.name.includes("__component__") && !INTERSECTED.parent.name.includes("__highlight_group__")) {

            var parent = INTERSECTED.parent;

            var temp = parent.name.split('-');
            var parentid = temp[temp.length - 1];


            this.controls.reset();
            this.scene.updateMatrixWorld();
            var newVector = new THREE.Vector3();
            newVector.setFromMatrixPosition(parent.matrixWorld);

            this.controls.target = newVector;

            if (newVector.x < 0) {

              this.camera.position.set(newVector.x + 70, newVector.y + 85, newVector.z);

            } else if (newVector.x > 0) {

              this.camera.position.set(newVector.x - 70, newVector.y + 85, newVector.z);

            }

            this.camera.updateProjectionMatrix();
            this.controls.update();


            // camera focus highlight ++++++++++++++++++++++++++++++++++++++++++++++++++
            var geometry = new THREE.OctahedronGeometry(10, 0);
            var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            var octa = new THREE.Mesh(geometry, material);
            var mat = new THREE.LineBasicMaterial({ color: 0xffffff });
            var wireframe = new THREE.LineSegments(geometry, mat);

            this.camindicator = new THREE.Group();
            this.camindicator.add(octa);
            this.camindicator.add(wireframe);

            this.camindicator.scale.set(0.05, 0.12, 0.05);
            this.scene.add(this.camindicator);
            this.camindicator.position.set(newVector.x, newVector.y + 43, newVector.z);
            this.camindicator.name = parentid;
            // camera focus highlight ++++++++++++++++++++++++++++++++++++++++++++++++++






          }
        }
      }
    }
  }
  // MOVE CAMERA POSITION  ======================================================================================================================

  // EXTRA FUNCTIONS ===========================================================================================================================


  popupHelpOpen() {
    if (this.loaded == true) {
      if (this.popuphelp.style.display == "none") {
        this.popuphelp.style.display = "block";
      }
      else {
        this.popuphelp.style.display = "none";
      }
    }
  }

  hideBuilding() {

    if (this.loaded == true) {

      if (this.buildinghidden == false) {
        this.building.children[0].material.opacity = 0;
        this.buildinghidden = true;
      }

      else if (this.buildinghidden == true) {
        this.building.children[0].material.opacity = 0.25;
        this.buildinghidden = false;
      }

    }
  }

  resetCamera() {

    if (this.loaded == true) {

      if (this.camindicator != null) {
        this.scene.remove(this.camindicator);
        this.camindicator = null;
      }

      this.controls.reset();
      this.scene.updateMatrixWorld();
      this.camera.position.set(250, 250, 250);
      this.camera.updateProjectionMatrix();
      this.controls.update();

    }
  }

  // EXTRA FUNCTIONS ===========================================================================================================================


  private initGL(): void {

    // Basic Init
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("rgba(255,255,255,1)");
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.updateProjectionMatrix();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio * 1.2);
    this.renderer.setSize(window.innerWidth * 1, window.innerHeight * 1);
    document.body.appendChild(this.renderer.domElement);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();


    // Mouse Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(250, 250, 250);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.controls.addEventListener('change', this.render);



    // Spawn GridHelper
    var size = 1000;
    var divisions = 80;
    var colorCenterLine = 0xEEEEEE;
    var colorGrid = 0xEEEEEE;
    var gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    this.scene.add(gridHelper);

    // Spawn Lighting
    var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
    keyLight.position.set(-100, 0, 100);
    keyLight.name = "keyLight";
    var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
    fillLight.position.set(100, 0, 100);
    fillLight.name = "fillLight";
    var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100).normalize();
    backLight.name = "backLight";
    this.scene.add(keyLight);
    this.scene.add(fillLight);
    this.scene.add(backLight);

    ////**********************************************************//
    //// ** THIS IS THE TRUE LOADED COMPLETE. ALWAYS USE ONLOAD **//
    //// Init Loader *********************************************//

    var scope = this;
    this.manager = new THREE.LoadingManager();
    this.manager.onStart = function (url, itemsLoaded, itemsTotal) {

      console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

    };

    this.manager.onProgress = function (url, itemsLoaded, itemsTotal) {

      console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

    };

    this.manager.onLoad = function () {

      console.log('Loading complete!');
      scope.interactables = [];
      scope.scene.children.forEach(function (child) {
        if (!child.name.includes('building') && !child.name.includes('plane')) {

          scope.interactables.push(child);
        }

      });


      scope.loaded = true;

      // NECESSARY GAP IN TIME  `````````````````````````````````
      setTimeout(function () {

        scope.popuphelp = document.getElementById("popupHelp");

        var divWidth = document.getElementById("rendererContainer").offsetWidth;
        console.log(divWidth);
        scope.camera.aspect = divWidth / window.innerHeight;

        scope.camera.updateProjectionMatrix();
        scope.renderer.setSize(divWidth, window.innerHeight);
        scope.controls.update();


      }, 0.1);
      // NECESSARY GAP IN TIME  `````````````````````````````````

    };


  }




  private initScene(): void {
    //// Spawn Plane
    var texture = new THREE.TextureLoader().load("assets/images/concrete.jpg");
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.2, map: texture, depthWrite: false });
    var geo = new THREE.BoxGeometry(170, 170, 0.5);
    this.plane = new THREE.Mesh(geo, mat);
    this.plane.rotateX(- Math.PI / 2);
    this.plane.name = "plane";
    this.scene.add(this.plane);
    this.plane.position.x -= 18;

    //// Spawn Building
    if (this.liftcount > 2) {
      var buildingPath = 'assets/models/lift/Building/';
      var buildingName = 'building';
      this.loadObject(buildingPath, buildingName, this.manager, this.scene, { 'type': 'building' });
    }
    else if (this.liftcount <= 2) {
      var buildingPath = 'assets/models/lift/Building/';
      var buildingName = 'building_small';
      this.loadObject(buildingPath, buildingName, this.manager, this.scene, { 'type': 'building' });
    }

  }

  // Load Obj and Mtl Function ================================================================================================================================

  private loadObject(path, name, manager, scene, opts): void {

    if (opts) { var overloads = opts; } //If Component

    var mtlLoader = new MTLLoader(manager);

    mtlLoader.load(path + name + '.mtl', (materials) => {
      materials.preload();
      var objLoader = new OBJLoader(manager);
      objLoader.setMaterials(materials);
      objLoader.load(path + name + '.obj', (object) => {

        //Lift Component configurations
        if (overloads && overloads['type'] == 'liftcomponent') {

          object.name = "__component__" + name + "-" + overloads['id'];
          object.scale.set(0.005, 0.006, 0.005);

          object.position.x += overloads['xShift'];
          object.position.z += overloads['zShift'];
          object.rotation.y = overloads['rotation'];


          if (overloads['id'] == 'mini') {
            //console.log(object);
            object.position.y -= 4.5;
            object.children.forEach(function (child) {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
                child.material.transparent = true;
                child.material.depthWrite = false;
                child.material.opacity = 0.25;
              }
            })
          }

          object.updateMatrix();
        }


        //Building-specific configurations
        if (overloads && overloads['type'] == 'building') {

          object.name = "building";
          object.scale.set(0.06, 0.022, 0.06);
          object.position.x -= 1;
          object.position.z -= 2;
          object.updateMatrix();
        }

        //LiftInterior-specific configurations
        if (overloads && overloads['type'] == 'interior') {

          if (overloads['name'] == 'man') {
            object.scale.set(1.05, 1.05, 1.05);
            //object.rotation.set(THREE.Math.degToRad(90),0, THREE.Math.degToRad(45));
            object.position.z += 2;
            object.position.x += 2;
            object.position.y += 0.5;

          }

          object.name = "__interiorComponent__" + overloads['name'];
          object.updateMatrix();

        }



        object.children.forEach((mesh) => {
          //console.log(mesh);
          if (mesh instanceof THREE.Mesh) {
            mesh.geometry.computeVertexNormals();
          }
        })

        scene.add(object);


        if (name.includes('building')) {
          this.building = object;
          this.building.children[0].material.transparent = true;
          this.building.children[0].material.depthWrite = false;
          //console.log(this.building);
        }

        this.render();
      });
    });
  }

  //===========================================================================================================================================================


  // INITCONTENT ==============================================================================================================================================

  private initContent(): void {


    // Names of Objects Lists
    var componentMain = ["electric_motor", "car", "crossheads", "cable", "elevator_pit_floor", "elevator_shaft", "guide_rails_main", "guide_roller_frame", "guide_rollers_main", "guide_sheaves", "guide_shoes_main", "platform_isolation", "pulley_system", "safety_plank"]
    var componentCounterWeight = ["counterweight_filters", "counterweight_frame", "guide_rails_counterweight", "guide_roller_counterweight", "guide_shoes_counterweight"]

    //Tweaking of position and rotation of lifts
    if (this.liftcount <= 2) {
      var PosRotArray =
        [
          // shift x , shift z , rotation around the y axis
          [22, -32, THREE.Math.degToRad(-90)], //id 0
          [-30, 16, THREE.Math.degToRad(90)], //id 1
        ];
    }
    else if (this.liftcount > 2) {
      var PosRotArray =
        [
          [18, -28, THREE.Math.degToRad(-90)], //id 0
          [-61, 25, THREE.Math.degToRad(90)], //id 1
          [-44, -25, THREE.Math.degToRad(90)], //id 2
          [35, 25, THREE.Math.degToRad(-90)], //id 3
        ];
    }

    // Load Obj, Mtl from name (Main Folder)
    for (var i = 0; i < this.liftcount; i++) {


      componentMain.forEach((name) => {
        var path = 'assets/models/lift/Main/';
        this.loadObject(path, name, this.manager, this.scene, { 'type': 'liftcomponent', 'id': i, 'xShift': PosRotArray[i][0], 'zShift': PosRotArray[i][1], 'rotation': PosRotArray[i][2] });
      })

      // Load Obj, Mtl from name (Counterweight Folder)
      componentCounterWeight.forEach((name) => {
        var path = 'assets/models/lift/Counterweight/';
        this.loadObject(path, name, this.manager, this.scene, { 'type': 'liftcomponent', 'id': i, 'xShift': PosRotArray[i][0], 'zShift': PosRotArray[i][1], 'rotation': PosRotArray[i][2] });

      })
    }

  }

  // ==========================================================================================================================================================




  // Set New Position Y =======================================================================================================================================
  private setPosY(position, vibration, lift): void {

    var movegroupMain = ["car", "guide_rollers_main", "guide_roller_frame", "platform_isolation", "crossheads", "safety_plank"];
    var movegroupCW = ["counterweight_frame", "counterweight_filters", "guide_rails_counterweight", "guide_roller_counterweight", "guide_shoes_counterweight"];

    var id = this.liftData.indexOf(lift);

    movegroupMain.forEach((name) => {
      var obj = this.scene.getObjectByName("__component__" + name + '-' + id);
      obj.position.y = 11.5 * position / 39000;
      obj.updateMatrix();
    });

    movegroupCW.forEach((name) => {
      var obj = this.scene.getObjectByName("__component__" + name + '-' + id);
      obj.position.y = -11.5 * position / 39000;
      obj.updateMatrix();
    });


    this.cardata[id]["position"] = position.toFixed(2);
    this.cardata[id]["vibration"] = vibration;


    //Delete and reshow label if there is a change and this component is selected
    //console.log(this.currentlabel);
    if (this.currentlabel.name == "__text__car-" + id) {

      this.scene.remove(this.currentlabel); // Remove old label

      var car = this.scene.getObjectByName("__component__car-" + id); // Get Label reference component

      var position = this.cardata[id]['position'];
      var vibration = this.cardata[id]['vibration'];

      var positionText = "Position: " + position;
      var vibrationText = "Vibration: " + vibration;

      this.currentlabel = new THREE.Group();

      var positionLabel = new SpriteText(positionText, 1.6, '#000', 'Arial', 150);
      positionLabel.position.set(car.position.x, car.position.y, car.position.z - 15);
      this.currentlabel.add(positionLabel);

      var vibrationLabel = new SpriteText(vibrationText, 1.6, "#000", 'Arial', 150);
      vibrationLabel.position.set(car.position.x, car.position.y - 3.2, car.position.z - 15);
      this.currentlabel.add(vibrationLabel);

      this.currentlabel.name = "__text__car-" + id;

      this.scene.add(this.currentlabel);
    }

  }

  // ==========================================================================================================================================================

  //Change Motor Status


  private changeMotorStatus(current, lift): void {

    var status = 'Normal';
    var currents = current.split(",");

    //arbitary current function
    if (currents[0] >= 0.25 || currents[1] >= 0.25) {
      var status = 'Danger';
    } else if (currents[0] < 0.25 && currents[0] >= 0.2 || currents[1] < 0.25 && currents[1] >= 0.2) {
      var status = 'Warning';
    } else if (currents[0] < 0.2 || currents[1] < 0.2) {
      var status = 'Normal';
    }

    var motorColor = {
      'Normal': '#00ff00',
      'Warning': '#FFA500',
      'Danger': '#FF0000'
    }

    let id = this.liftData.indexOf(lift);

    var motorGroup = this.scene.getObjectByName("__component__electric_motor" + '-' + id);

    if (this.motordata[id]["signal"] != null) {
      motorGroup.remove(this.motordata[id]["signal"]);
      this.motordata[id]["signal"] = null;
    }

    //Init empty array for signal
    var signalGroup = new THREE.Group();
    var partNum = 0;

    motorGroup.children.forEach(function (child) {

      if (!child.name.includes("__highlight_group")) {

        try {
          var geo = new THREE.EdgesGeometry(child.geometry, 1);
          var mat = new THREE.LineBasicMaterial({ color: motorColor[status], linewidth: 1, linejoin: 'bevel' });
          var signal = new THREE.LineSegments(geo, mat);
          signal.name = "__signal__electric_motor__part_" + partNum + '-' + id;
          signal.scale.set(1.01, 1.01, 1.01);
          signalGroup.add(signal);

        } catch (error) { }
      }

      partNum++;
    });

    signalGroup.name = "__signal_group__electric_motor-" + id;

    this.motordata[id]["signal"] = signalGroup;
    motorGroup.add(signalGroup);

    this.motordata[id]["current"] = current;
    this.motordata[id]["status"] = status;

    //console.log(this.currentlabel);
    //Delete and reshow label if there is a change and this component is selected
    if (this.currentlabel.name == "__text__electric_motor-" + id) {


      this.scene.remove(this.currentlabel); // Remove old label

      var motor = this.scene.getObjectByName("__component__electric_motor-" + id); // Get Label reference component

      var currentText = "⚡ Current: " + this.motordata[id]['current'];
      var status = this.motordata[id]['status'];
      if (status == null) { var color = '#000' }
      else if (status == 'Danger') { var color = '#ff0000' }
      else if (status == 'Warning') { var color = '#ffa500' }
      else if (status == 'Normal') { var color = '#228b22' }

      this.currentlabel = new SpriteText(currentText, 1.6, color, 'Arial', 100);
      this.currentlabel.name = "__text__electric_motor-" + id;

      this.currentlabel.position.z = motor.position.z + 0;
      this.currentlabel.position.y = motor.position.y + 34;
      this.currentlabel.position.x = motor.position.x + 0;

      this.scene.add(this.currentlabel);

    }

  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }


  ngAfterViewInit() {

    this.initGL();
    this.initScene();
    this.initContent();



    let component: LiftComponent = this;



    (function render() {

      component.render();

    }());



    var timePassed = 0;
    var scope = this;
    var posY = [
      { pos: 0, direction: 'up' },
      { pos: 400, direction: 'up' },
      { pos: 300, direction: 'up' },
      { pos: 1000, direction: 'up' },
    ];

    window.setInterval(function () {

        var index = 0
        scope.liftData.forEach(function (lift) {

          if (timePassed % 300 == 0) {
            var randMotorA = (Math.random() * (0.3 - 0.01) + 0.01).toFixed(4);
            var randMotorB = (Math.random() * (0.3 - 0.01) + 0.01).toFixed(4);

            try {
              if (Math.random() < 0.5) {
                scope.changeMotorStatus(randMotorA + "," + randMotorB, lift);
              }
            } catch { };
          }

          try {
            scope.setPosY(posY[index].pos, "0,0,0", lift);
          } catch { }


          index += 1

        });
      
      
      scope.render();
      timePassed += 20;
      posY.forEach(function (posSet) {

        if (posSet.direction == 'up') {
          if (posSet.pos < 39000) {
            posSet.pos += Math.floor(Math.random() * 600) + 1;
          } else if (posSet.pos >= 39000) {
            posSet.direction = 'down';
          }
        }

        else if (posSet.direction == 'down') {
          if (posSet.pos > 1) {
            posSet.pos -= Math.floor(Math.random() * 600) + 1;
          } else if (posSet.pos <= 1) {
            posSet.direction = 'up';
          }
        }

      })

    }, 20);

  }

}
