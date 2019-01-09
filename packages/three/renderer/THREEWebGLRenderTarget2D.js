import { Scene } from "../../three/src/scenes/Scene.js";
import { Mesh } from "../../three/src/objects/Mesh.js";
import { PlaneBufferGeometry } from "../../three/src/geometries/PlaneGeometry.js";
import { WebGLRenderTarget } from "../../three/src/renderers/WebGLRenderTarget.js";
import { OrthographicCamera } from "../../three/src/cameras/OrthographicCamera.js";

import THREEShaderMaterial from "../material/THREEShaderMaterial.js";

export default class THREEWebGLRenderTarget2D extends WebGLRenderTarget {
	constructor({
		material,
		renderer,
		width = 1024,
		height = 1024,
	}) {
		super(width, height, {});

		this.material = material;
		this.renderer = renderer;

		this._scene = new Scene();
		this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		
		this._quad = new Mesh(new PlaneBufferGeometry(2, 2), material);
		this._scene.add(this._quad);

		this.render();
	}

	render() {
		this.renderer.render(this._scene, this._camera, this);
	}
}