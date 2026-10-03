import React, { useEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SandboxConfig } from './sandbox-types';
import { Atlas } from '../../app/anatomy';

interface Props {
  atlas: Atlas | null;
  config: SandboxConfig;
}

export function SandboxScene({ atlas, config }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: T.WebGLRenderer;
    scene: T.Scene;
    camera: T.PerspectiveCamera;
    controls: OrbitControls;
    keyLight: T.DirectionalLight;
    rimLight: T.DirectionalLight;
    hemiLight: T.HemisphereLight;
    ground: T.Mesh;
    platform: T.Mesh;
    meshGroup: T.Group;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(config.clearColor);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = config.exposure;
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(config.fov, el.clientWidth / el.clientHeight, 0.005, 100);
    camera.position.set(1.4, 1.05, 3.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = true;
    controls.dampingFactor = config.dampingFactor;

    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    const hemiLight = new T.HemisphereLight(
      new T.Color(config.hemiSkyColor),
      new T.Color(config.hemiGroundColor),
      config.hemiLightIntensity
    );
    scene.add(hemiLight);

    const keyLight = new T.DirectionalLight(0xfffaf4, config.keyLightIntensity);
    keyLight.position.set(config.keyLightX, config.keyLightY, config.keyLightZ);
    scene.add(keyLight);

    const rimLight = new T.DirectionalLight(0xe9f0ff, config.rimLightIntensity);
    rimLight.position.set(config.rimLightX, config.rimLightY, config.rimLightZ);
    scene.add(rimLight);

    const ground = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({ color: 0xd5d9dc, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    ground.visible = config.groundVisible;
    scene.add(ground);

    const platform = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({ color: 0xeeeeec, metalness: 0.12, roughness: 0.67 })
    );
    platform.position.y = -0.016;
    platform.visible = config.platformVisible;
    scene.add(platform);

    const meshGroup = new T.Group();
    meshGroup.scale.setScalar(config.meshScale);
    scene.add(meshGroup);

    // Default placeholder mannequin mesh if atlas is loading
    const placeholderMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const sphere = new T.Mesh(new T.SphereGeometry(0.2, 32, 32), placeholderMat);
    sphere.position.set(0, 0.85, 0);
    meshGroup.add(sphere);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      keyLight,
      rimLight,
      hemiLight,
      ground,
      platform,
      meshGroup,
    };

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!el || !renderer || !camera) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update dynamic properties when config changes
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;

    s.renderer.setClearColor(config.clearColor);
    s.renderer.toneMappingExposure = config.exposure;

    s.camera.fov = config.fov;
    s.camera.updateProjectionMatrix();

    s.controls.dampingFactor = config.dampingFactor;

    s.keyLight.intensity = config.keyLightIntensity;
    s.keyLight.position.set(config.keyLightX, config.keyLightY, config.keyLightZ);

    s.rimLight.intensity = config.rimLightIntensity;
    s.rimLight.position.set(config.rimLightX, config.rimLightY, config.rimLightZ);

    s.hemiLight.intensity = config.hemiLightIntensity;
    s.hemiLight.color.set(config.hemiSkyColor);
    s.hemiLight.groundColor.set(config.hemiGroundColor);

    s.ground.visible = config.groundVisible;
    s.platform.visible = config.platformVisible;

    s.meshGroup.scale.setScalar(config.meshScale);
  }, [config]);

  return <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-900" />;
}
