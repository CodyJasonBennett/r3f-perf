import { FC, HTMLAttributes, memo, Suspense, useMemo, useRef, useState } from 'react';
import { matriceCount, matriceWorldCount, usePerfStore } from '../headless';
import { Graph, Graphpc } from '../styles';
import { PauseIcon } from '@radix-ui/react-icons';
import { Canvas, useFrame, useThree, Viewport } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { chart, customData } from '..';
import { colorsGraph } from '../gui';
import * as THREE from 'three';

export interface graphData {
  curve: THREE.SplineCurve;
  maxVal: number;
  element: string;
}

interface PerfUIProps extends HTMLAttributes<HTMLDivElement> {
  perfContainerRef?: any;
  colorBlind?: boolean;
  showGraph?: boolean;
  antialias?: boolean;
  chart?: chart;
  customData?: customData;
  minimal?: boolean;
  matrixUpdate?: boolean;
}
interface TextHighHZProps {
  metric?: string;
  colorBlind?: boolean;
  isPerf?: boolean;
  hasInstance?: boolean;
  isMemory?: boolean;
  isShadersInfo?: boolean;
  fontSize: number;
  round: number;
  color?: string;
  offsetX: number;
  offsetY?: number;
  customData?: customData;
  minimal?: boolean;
}

const TextHighHZ: FC<TextHighHZProps> = memo(({isPerf,color, colorBlind, customData, isMemory, isShadersInfo, metric, fontSize,offsetY=0, offsetX, round, hasInstance }) => {
  const { width: w, height: h } = useThree(s => s.viewport)
  const fpsRef = useRef<any>(null)
  const fpsInstanceRef = useRef<any>(null)

  useFrame(function updateR3FPerfText() {
    const gl:any = usePerfStore.getState().gl
    const log = usePerfStore.getState().log
    
    if (!log || !fpsRef.current) return

    if (customData) {
      fpsRef.current.text = usePerfStore.getState().customData
    }
  
    if (!metric) return

    let info = log[metric]
    if (isShadersInfo) {
      info = gl.info.programs?.length
    } else if (metric === 'matriceCount') {
      info = matriceCount.value
    } else if (!isPerf && gl.info.render) {
      const infos: any = isMemory? gl.info.memory : gl.info.render
      info = infos[metric]
    }
   
    if (metric === 'fps') {
      fpsRef.current.color = usePerfStore.getState().overclockingFps ? colorsGraph(colorBlind).overClock.toString() : `rgb(${colorsGraph(colorBlind).fps.toString()})`
    }
    fpsRef.current.text = (metric === 'maxMemory' ? '/' : '') + (Math.round(info * Math.pow(10, round)) / Math.pow(10, round)).toFixed(round)
         

    if (hasInstance) {
      const infosInstance: any = gl.info.instance

    
      if (typeof infosInstance === 'undefined' && metric !== 'matriceCount') {
        return
      }

      let infoInstance
      if(metric === 'matriceCount') {
        infoInstance = matriceWorldCount.value
      }else{
        infoInstance = infosInstance[metric]
      }

      if (infoInstance > 0) {

        fpsRef.current.fontSize = fontSize / 1.15
        fpsInstanceRef.current.fontSize = info > 0 ? fontSize / 1.4 : fontSize
        
        fpsRef.current.position.y = h/2 - offsetY - fontSize / 1.9
        fpsInstanceRef.current.text = ' ±	' + (Math.round(infoInstance * Math.pow(10, round)) / Math.pow(10, round)).toFixed(round)
      } else {
       
        fpsRef.current.position.y = h/2 - offsetY - fontSize
        fpsRef.current.fontSize = fontSize
      }

    }
    matriceCount.value -= 1
    fpsRef.current.updateMatrix()
    fpsRef.current.matrixWorld.copy(fpsRef.current.matrix)
  })
  return (
    <Suspense fallback={null}>
      <Text textAlign='justify'  matrixAutoUpdate={false} ref={fpsRef} fontSize={fontSize} position={[-w / 2 + (offsetX) + fontSize,h/2 - offsetY - fontSize,0 ]} color={color} characters="0123456789" 
      onUpdate={(self)=>{
        self.updateMatrix()
        matriceCount.value -= 1
        self.matrixWorld.copy(self.matrix)
      }}
      >
        <meshBasicMaterial blending={THREE.NormalBlending} />
      0
      </Text>
      {hasInstance && (
         <Text textAlign='justify' matrixAutoUpdate={false} ref={fpsInstanceRef} fontSize={8} position={[-w / 2 + (offsetX) + fontSize,h/2 - offsetY - fontSize * 1.15,0 ]} color={'lightgrey'} characters="0123456789"
         onUpdate={(self)=>{
          self.updateMatrix()
          matriceCount.value -= 1
          self.matrixWorld.copy(self.matrix)
          }} >
            <meshBasicMaterial blending={THREE.NormalBlending} />
         </Text>
      )
      }
    </Suspense>
  )
})

const TextsHighHZ: FC<PerfUIProps> = ({ colorBlind, customData, minimal, matrixUpdate }) => {
  // const [supportMemory] = useState(window.performance.memory)
  const supportMemory = false
  
  const fontSize: number = 14
  return (
    <>
      <TextHighHZ colorBlind={colorBlind} color={`rgb(${colorsGraph(colorBlind).fps.toString()})`} isPerf metric='fps' fontSize={fontSize} offsetX={140} round={0} />
      <TextHighHZ color={supportMemory ? `rgb(${colorsGraph(colorBlind).mem.toString()})` : ''} isPerf metric='mem' fontSize={fontSize} offsetX={80} round={0} />
      <TextHighHZ color={supportMemory ? `rgb(${colorsGraph(colorBlind).mem.toString()})` : ''} isPerf metric='maxMemory' fontSize={8} offsetX={112} offsetY={10} round={0} />
      <TextHighHZ color={`rgb(${colorsGraph(colorBlind).gpu.toString()})`} isPerf metric='gpu'  fontSize={fontSize} offsetX={10} round={3}/>
      {!minimal ? (
          <>
           <TextHighHZ metric='calls' fontSize={fontSize} offsetX={200} round={0} hasInstance />
           <TextHighHZ metric='triangles'  fontSize={fontSize} offsetX={260} round={0} hasInstance/>
           <TextHighHZ isMemory metric='geometries' fontSize={fontSize} offsetY={30} offsetX={0} round={0} />
           <TextHighHZ isMemory metric='textures'  fontSize={fontSize} offsetY={30} offsetX={80} round={0} />
           <TextHighHZ isShadersInfo metric='programs'  fontSize={fontSize} offsetY={30} offsetX={140} round={0} />
           <TextHighHZ metric='lines'  fontSize={fontSize} offsetY={30} offsetX={200} round={0} hasInstance/>
           <TextHighHZ metric='points'  fontSize={fontSize} offsetY={30} offsetX={260} round={0} hasInstance/>
            {matrixUpdate && <TextHighHZ isPerf metric='matriceCount' fontSize={fontSize} offsetY={30} offsetX={320} round={0} hasInstance/>}
          </>
       ) : null}
     
      {customData && <TextHighHZ color={`rgb(${colorsGraph(colorBlind).custom.toString()})`}  customData={customData} fontSize={fontSize} offsetY={0} offsetX={minimal ? 200 : 320} round={0}/>}
    </>
  );
};


const ChartCurve:FC<PerfUIProps> = ({colorBlind, minimal, chart= {length: 30, hz: 15}}) => {
  
  // Create a viewport. Units are in pixels.
  // const coords = candyGraph.createCartesianCoordinateSystem(
  //   candyGraph.createLinearScale([0, 1], [0, viewport.width - 4]),
  //   candyGraph.createLinearScale([0, 1], [10, viewport.height - 4])
  // );
  const curves: any = useMemo(() => {
    return {
      fps: new Float32Array(chart.length * 3),
      mem: new Float32Array(chart.length * 3),
      gpu: new Float32Array(chart.length * 3)
    }
  }, [chart])

  const fpsRef= useRef<any>(null)
  const fpsMatRef= useRef<any>(null)
  const gpuRef= useRef<any>(null)
  const memRef= useRef<any>(null)

  const dummyVec3 = useMemo(() => new THREE.Vector3(0,0,0), [])
  const updatePoints = (element: string, factor: number = 1, ref: any, viewport: Viewport) => {
    let maxVal = 0;
    const {width: w, height: h} = viewport
    const chart = usePerfStore.getState().chart.data[element];
    if (!chart || chart.length === 0) {
      return
    }
    const padding = minimal ? 2 : 6
    const paddingTop = minimal ? 12 : 50
    let len = chart.length;
    for (let i = 0; i < len; i++) {
      let id = (usePerfStore.getState().chart.circularId + i + 1) % len;
      if (chart[id] !== undefined) {
        if (chart[id] > maxVal) {
          maxVal = chart[id] * factor;
        }
        dummyVec3.set(padding + i / (len - 1) * (w - padding * 2) - w / 2, (Math.min(100, chart[id]) * factor) / 100 * (h - padding * 2 - paddingTop) - h / 2, 0)
        
        dummyVec3.toArray(ref.attributes.position.array, i * 3)
      }
    }
    
    ref.attributes.position.needsUpdate = true;
  };

  const [supportMemory] = useState(window.performance.memory)
  useFrame(function updateChartCurve({viewport}) {
    
    updatePoints('fps', 1, fpsRef.current, viewport)
    if (fpsMatRef.current) {
      fpsMatRef.current.color.set(usePerfStore.getState().overclockingFps ? colorsGraph(colorBlind).overClock.toString() : `rgb(${colorsGraph(colorBlind).fps.toString()})`)
    }
    updatePoints('gpu', 5, gpuRef.current, viewport)
    if (supportMemory) {
      updatePoints('mem', 1, memRef.current, viewport)
    }
  })
  return (
    <>
      <line>
        <bufferGeometry ref={fpsRef}>
          <bufferAttribute
              attach={'attributes-position'}
              count={chart.length}
              array={curves.fps}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
              needsUpdate={true}
            />
        </bufferGeometry>
        <lineBasicMaterial ref={fpsMatRef} color={`rgb(${colorsGraph(colorBlind).fps.toString()})`} transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry ref={gpuRef}>
          <bufferAttribute
              attach={'attributes-position'}
              count={chart.length}
              array={curves.gpu}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
              needsUpdate={true}
            />
        </bufferGeometry>
        <lineBasicMaterial color={`rgb(${colorsGraph(colorBlind).gpu.toString()})`} transparent opacity={0.5} />
      </line>
      {supportMemory && <line>
        <bufferGeometry ref={memRef}>
          <bufferAttribute
            attach={'attributes-position'}
            count={chart.length}
            array={curves.mem}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
            needsUpdate={true}
          />
        </bufferGeometry>
        <lineBasicMaterial color={`rgb(${colorsGraph(colorBlind).mem.toString()})`} transparent opacity={0.5} />
      </line>}
    </>
  );
};

export const ChartUI: FC<PerfUIProps> = ({
  colorBlind,
  chart,
  customData,
  matrixUpdate,
  showGraph= true,
  antialias= true,
  minimal,
}) => {
  const canvas = useRef<any>(undefined);

  const paused = usePerfStore((state) => state.paused);
  return (
    <Graph
      style={{
        display: 'flex',
        position: 'absolute',
        height: `${minimal ? 37 : showGraph ? 100 : 60 }px`,
        minWidth: `${minimal ? '100px' : customData ? '370px' : '310px'}`
      }}
    >
      <Canvas
        ref={canvas}
        orthographic
        dpr={antialias ? [1,2] : 1}
        gl={{
          antialias: true,
          alpha: true,
          stencil: false,
          depth: false,
        }}
        onCreated={({scene}) => {
          scene.traverse((obj: THREE.Object3D)=>{
            //@ts-ignore
            obj.matrixWorldAutoUpdate=false
            obj.matrixAutoUpdate=false
          })
        }}
        flat={true}
        style={{
          marginBottom: `-42px`,
          position: 'relative',
          pointerEvents: 'none',
          background: 'transparent !important',
          height: `${minimal ? 37 : showGraph ? 100 : 60 }px`
        }}
      >
        {!paused ? (
          <>
            <Renderer />
            <TextsHighHZ customData={customData} minimal={minimal} matrixUpdate={matrixUpdate} />
            {showGraph && <ChartCurve
              colorBlind={colorBlind}
              minimal={minimal}
              chart={chart}
            />}
          </>
        ) : null}
      </Canvas>
      {paused && (
        <Graphpc>
          <PauseIcon /> PAUSED
        </Graphpc>
      )}
    </Graph>
  );
};

const Renderer = () =>{

  useFrame(function updateR3FPerf({ gl, scene, camera }) {
    camera.updateMatrix()
    matriceCount.value -= 1
    camera.matrixWorld.copy(camera.matrix)
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    gl.render(scene,camera)
    matriceWorldCount.value = 0
    matriceCount.value = 0
  }, Infinity)

  
  return null
}