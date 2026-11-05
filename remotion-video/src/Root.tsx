import React from "react";
import { Composition, Series } from "remotion";
import { Phase1Problem } from "./Phase1Problem";
import { Phase2Vultr } from "./Phase2Vultr";
import { Phase3Synthesis } from "./Phase3Synthesis";
import { Phase4Containment } from "./Phase4Containment";
import { Phase5Platform } from "./Phase5Platform";
import { Phase6Conclusion } from "./Phase6Conclusion";

export const MainVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={820}>
        <Phase1Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={910}>
        <Phase2Vultr />
      </Series.Sequence>
      <Series.Sequence durationInFrames={890}>
        <Phase3Synthesis />
      </Series.Sequence>
      <Series.Sequence durationInFrames={970}>
        <Phase4Containment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={780}>
        <Phase5Platform />
      </Series.Sequence>
      <Series.Sequence durationInFrames={570}>
        <Phase6Conclusion />
      </Series.Sequence>
    </Series>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LatchDemo"
        component={MainVideo}
        durationInFrames={4940}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase1"
        component={Phase1Problem}
        durationInFrames={820}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase2"
        component={Phase2Vultr}
        durationInFrames={910}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase3"
        component={Phase3Synthesis}
        durationInFrames={890}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase4"
        component={Phase4Containment}
        durationInFrames={970}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase5"
        component={Phase5Platform}
        durationInFrames={780}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase6"
        component={Phase6Conclusion}
        durationInFrames={570}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
