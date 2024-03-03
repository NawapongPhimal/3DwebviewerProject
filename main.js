import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

//----------------------------------------------------------------------------------------------------//

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

//----------------------------------------------------------------------------------------------------//

//scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 30, 100);
const cameraControls = {
    lockCamera: false,
};
camera.near = 1;
camera.far = 1000; // Adjust based on the scene's size
camera.updateProjectionMatrix();

//control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

//----------------------------------------------------------------------------------------------------//

//ground
const groundGeometry = new THREE.PlaneGeometry(20, 20, 1, 1); // Fewer divisions
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  side: THREE.DoubleSide
});

//----------------------------------------------------------------------------------------------------//

//shadow
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

//Light
 const spotLight = new THREE.SpotLight(0xffffff, 3, 100, 0.2, 0.5);
spotLight.position.set(0, 35, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0xededed, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
scene.add(directionalLight);
directionalLight.position.set(18, 11, 7);

//test plane mesh
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(20 ,20),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    visible: false
  })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

//grid
let grid;

function initGridHelper() {
  grid = new THREE.GridHelper(20, 20);
  grid.visible = false;
  scene.add(grid);
}
initGridHelper();

// Function to update wireframe visibility for all mesh materials in the model
function updateWireframeVisibility(visible) {
  if (!currentModel) {
    console.log("No model is currently loaded.");
    return;
  }

  currentModel.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.wireframe = visible);
      } else {
        child.material.wireframe = visible;
      }
    }
  });
}

//----------------------------------------------------------------------------------------------------//

const gui = new dat.GUI();

const options = {
    backgroundColor: '#000000',
    showGround: true,
    autoRotateModel: false,
    showTransformControls: true,
    wireframe: false,
    showGrid: false,
    'Main': 0x8c653e,
    'Hooves': 0x756b67,
    'Main_Light': 0xcfaa94,
    'Main_Dark': 0x6b4539,
    'Eye_Lighter': 0x756b67,
    'Eye_Black': 0x000000,
    'Eye_White': 0xf5f5f5,
};

const loadedModels = [];
const guiFolders = {}; // Object to store GUI folder references
const deleteButtons = {}; // Object to store Delete button references

//----------------------------------------------------------------------------------------------------//

// zoom option
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 20);
cameraFolder.open();

cameraFolder.add(cameraControls, 'lockCamera').name('Lock Camera Movement').onChange(function(value) {
    controls.enabled = !value;
});


//----------------------------------------------------------------------------------------------------//

// Add Background Color controller to GUI
gui.addColor(options, 'backgroundColor').name('Bg_Color ').onChange(function(newValue) {
  renderer.setClearColor(newValue, 1.0);
  console.log('Background color changed to: ' + newValue);
});

// Add Show Ground checkbox to GUI
gui.add(options, 'showGround').name('Show Ground').onChange(function(value) {
  groundMesh.visible = value;
  console.log('Ground visibility set to: ' + value);
});

// Add Show Model Wireframe checkbox to GUI
window.addEventListener('DOMContentLoaded', function() {
  const wireframeControl = gui.add(options, 'wireframe').name('Show Wireframe');
  
  wireframeControl.onChange(function(value) {
    updateWireframeVisibility(value);
  });
});

// Add Auto-Rotate Model checkbox to GUI
gui.add(options, 'autoRotateModel').name('Auto-Rotate Model').onChange(function(value) {
  console.log('Auto-Rotate Model set to: ' + value);
});

// Add Show Transform Controls checkbox to GUI
gui.add(options, 'showTransformControls').name('Show Transform Controls').onChange(toggleTransformControlsVisibility);

function toggleTransformControlsVisibility(value) {
    if (value && currentModel && currentTransformControls) {
        currentTransformControls.attach(currentModel);
    } else if (currentTransformControls) {
        currentTransformControls.detach();
    }
    console.log('Transform controls visibility set to: ' + value);
}

// Add Show Grid checkbox to GUI
gui.add(options, 'showGrid').name('Show Grid').onChange(function(value) {
  grid.visible = value; // This will now correctly reference the global grid variable
});

//----------------------------------------------------------------------------------------------------//

//model references
const modelFolder = gui.addFolder('Sample Model');
const modelConfig = {
    Deer: function () {
        uploadModel('./asset/gLTF/Deer.gltf', 'Deer');
    },
    Cow: function () {
        uploadModel('./asset/gLTF/Cow.gltf', 'Cow');
    },
    Horse: function () {
        uploadModel('./asset/gLTF/Horse.gltf', 'Horse');
    },
    Alpaca: function () {
        uploadModel('./asset/gLTF/Alpaca.gltf', 'Alpaca');
    },
};

// Add folders for each model
const modelFolders = {};
Object.keys(modelConfig).forEach((modelName) => {
  const folder = modelFolder.addFolder(modelName);
  modelFolders[modelName] = folder;

  const deleteButton = {
    delete: function () {
      deleteModel(modelName);
    },
  };
  folder.add(modelConfig, `${modelName}`).name(`${modelName}`);
  folder.add(deleteButton, 'delete').name(`Delete ${modelName}`);
});
//----------------------------------------------------------------------------------------------------//

function uploadModel(modelPath, modelName) {
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;
      scene.add(model);
  
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.attach(model);
      scene.add(transformControls);
  
      const existingModel = loadedModels.find((m) => m.name === modelName);
  
      if (!existingModel) {
        loadedModels.push({
          name: modelName,
          object: model,
          transformControls: transformControls,
        });
      } else {
        existingModel.object = model;
        existingModel.transformControls = transformControls;
      }
  
      // Check if the color folder already exists
      if (!guiFolders[modelName]) {
        const colorFolder = gui.addFolder(`${modelName} Color`);
        guiFolders[modelName] = colorFolder;
        addColorControls(model, colorFolder);
        colorFolder.open();
      }
  
      // Enable drag-based transformation on mouse
      addDragControls(model, transformControls);
  
      // Enable translation controls
      transformControls.setMode('translate');
      addTransformControls(transformControls);
    });
  }

function addColorControls(model, colorFolder) {
    colorFolder.addColor(options, 'Main').onChange(function (e) {
        model.getObjectByName('Cube').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Hooves').onChange(function (e) {
        model.getObjectByName('Cube_1').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Main_Light').onChange(function (e) {
        model.getObjectByName('Cube_2').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Main_Dark').onChange(function (e) {
        model.getObjectByName('Cube_3').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Eye_Lighter').onChange(function (e) {
        model.getObjectByName('Cube_4').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Eye_Black').onChange(function (e) {
        model.getObjectByName('Cube_5').material.color.setHex(e);
    });
    colorFolder.addColor(options, 'Eye_White').onChange(function (e) {
        model.getObjectByName('Cube_6').material.color.setHex(e);
    });
}

//----------------------------------------------------------------------------------------------------//

function addTransformControls(transformControls) {
    // Update the model's position when translation controls change
    transformControls.addEventListener('objectChange', function () {
        transformControls.object.position.copy(transformControls.object.position);
    });

    // Use mouseUp event to detach and dispose of controls
    transformControls.addEventListener('mouseUp', function () {
        transformControls.detach();
        transformControls.dispose();

        // Clear the console after dragging the model
        console.clear();
    });
}

//----------------------------------------------------------------------------------------------------//

function deleteModel(modelName) {
    const index = loadedModels.findIndex((model) => model.name === modelName);
    if (index !== -1) {
      const { object: modelToRemove, transformControls } = loadedModels[index];
  
      transformControls.detach();
      transformControls.dispose();
      scene.remove(transformControls);
      scene.remove(modelToRemove);
      loadedModels.splice(index, 1);
  
      const colorFolder = guiFolders[modelName];
      if (colorFolder) {
        colorFolder.close();
        gui.removeFolder(colorFolder);
        delete guiFolders[modelName];
      }
  
      // Remove the delete button from the corresponding model folder
      const modelFolderToDelete = modelFolders[modelName];
      if (modelFolderToDelete) {
        const deleteButton = modelFolderToDelete.__controllers.find(
          (controller) => controller.name === `Delete ${modelName}`
        );
        if (deleteButton) {
          modelFolderToDelete.remove(deleteButton);
        }
      }
  
      console.clear();
    }
  }

//----------------------------------------------------------------------------------------------------//

let currentModel = null;
let currentTransformControls = null;

const partColors = {
  Cube: '#ffffff',
  Cube_1: '#ffffff',
  Cube_2: '#ffffff',
  Cube_3: '#ffffff',
  Cube_4: '#ffffff',
  Cube_5: '#ffffff',
  Cube_6: '#ffffff',
};

// Function to update model part color
function updateModelPartColor(partName, colorHex) {
  if (!currentModel) {
    console.log("No model is currently loaded.");
    return;
  }

  let partFound = false;
  currentModel.traverse((child) => {
    if (child.isMesh && child.name.includes(partName)) {
      partFound = true;
      const newColor = new THREE.Color(colorHex);
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => updateMaterialColor(material, newColor));
      } else {
        updateMaterialColor(child.material, newColor);
      }
    }
  });

  if (!partFound) {
    console.log(`No part found with name including '${partName}'.`);
  } else {
    console.log(`Color of '${partName}' updated to ${colorHex}.`);
  }
}

function updateMaterialColor(material, color) {
  if (material.color) {
    material.color.set(color);
  } else {
    console.log("Material does not have a color property.");
  }
}

// Create GUI controls for each part color and add change listeners
Object.entries(partColors).forEach(([partName, color]) => {
  gui.addColor(partColors, partName).onChange((newValue) => {
    updateModelPartColor(partName, newValue);
  });
});

//----------------------------------------------------------------------------------------------------//

// Export model function
document.addEventListener('DOMContentLoaded', function() {
  const exportModelButton = document.getElementById('exportModel');

  exportModelButton.addEventListener('click', function() {
    if (!currentModel || !currentModelFileName) {
      console.log("No model is currently loaded to export.");
      return;
    }

    const exporter = new GLTFExporter();
    const options = {
      binary: false, // Set to true for GLB output
    };

    exporter.parse(currentModel, function(gltf) {
      // Ensure the GLTF data is correctly stringified to JSON
      const gltfString = JSON.stringify(gltf);
      const exportFileName = currentModelFileName + '.gltf'; // Append '.gltf' extension to the stored file name
      saveString(gltfString, exportFileName);
    }, options);
  });
});

function saveArrayBuffer(buffer, filename) {
  const blob = new Blob([buffer], {type: 'application/octet-stream'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to save GLTF output (JSON string)
function saveString(text, filename) {
  const blob = new Blob([text], {type: 'application/json'}); // Change MIME type to application/json
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//----------------------------------------------------------------------------------------------------//

// loading model from file
let currentModelFileName = '';

document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.querySelector('input[type="file"]');
  const removeModelButton = document.getElementById('removeModel');

  // Add event listener to the remove model button here, outside of the file input change listener
  removeModelButton.addEventListener('click', function() {
    if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }

    if (currentTransformControls) {
      scene.remove(currentTransformControls);
      currentTransformControls.detach();
      currentTransformControls = null;
    }

    console.log("Model and controls removed.");
  });

  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }
    currentModelFileName = file.name.split('.')[0];

    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(url, function(gltf) {
      if (currentModel) {
        scene.remove(currentModel);
      }
      
      currentModel = gltf.scene;
      scene.add(currentModel);

      if (currentTransformControls) {
        scene.remove(currentTransformControls);
      }

      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.attach(currentModel);
      scene.add(transformControls);
      currentTransformControls = transformControls;

      transformControls.addEventListener('dragging-changed', function(event) {
        controls.enabled = !event.value;
      });

      // Apply colors to the model parts after model is loaded
      Object.entries(partColors).forEach(([partName, color]) => {
        updateModelPartColor(partName, color);
      });

      // Add event listener to the remove model button
      removeModelButton.addEventListener('click', function() {
      if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }
    
    if (currentTransformControls) {
      scene.remove(currentTransformControls);
      currentTransformControls.detach();
      currentTransformControls = null;
    }
    
    console.log("Model and controls removed.");
  });

      URL.revokeObjectURL(url);
    }, undefined, function(error) {
      console.error('An error happened during the model loading:', error);
    });
  });
});

//----------------------------------------------------------------------------------------------------//

// animate scene
function animate() {
    requestAnimationFrame(animate);

    if (options.autoRotateModel && currentModel) {
      currentModel.rotation.y += 0.01; // Adjust the rotation speed as needed
    }

    if (!cameraControls.lockCamera) {
        controls.update();
    }
    controls.update();
    renderer.render(scene, camera);
}

animate();

//----------------------------------------------------------------------------------------------------//

// Declaration and initialization of progressBarDiv
var progressBarDiv = document.createElement('div');
progressBarDiv.innerText = 'Loading...';
progressBarDiv.style.cssText = `
  display: none; // Initially hidden
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 20px;
  z-index: 100;
`;
document.body.appendChild(progressBarDiv);

//window resize
window.addEventListener( 'resize', onWindowResize );
progressBarDiv = document.createElement( 'div' );
progressBarDiv.innerText = 'Loading...';
progressBarDiv.style.fontSize = '3em';
progressBarDiv.style.color = '#888';
progressBarDiv.style.display = 'block';
progressBarDiv.style.position = 'absolute';
progressBarDiv.style.top = '50%';
progressBarDiv.style.width = '100%';
progressBarDiv.style.textAlign = 'center';

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();            
  renderer.setSize(window.innerWidth, window.innerHeight);            
}

//----------------------------------------------------------------------------------------------------//