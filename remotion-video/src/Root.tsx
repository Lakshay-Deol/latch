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
      <Series.Sequence durationInFrames={810}>
        <Phase1Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={960}>
        <Phase2Vultr />
      </Series.Sequence>
      <Series.Sequence durationInFrames={885}>
        <Phase3Synthesis />
      </Series.Sequence>
      <Series.Sequence durationInFrames={1000}>
        <Phase4Containment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={730}>
        <Phase5Platform />
      </Series.Sequence>
      <Series.Sequence durationInFrames={700}>
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
        durationInFrames={5085}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase1"
        component={Phase1Problem}
        durationInFrames={810}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase2"
        component={Phase2Vultr}
        durationInFrames={960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase3"
        component={Phase3Synthesis}
        durationInFrames={885}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase4"
        component={Phase4Containment}
        durationInFrames={1000}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase5"
        component={Phase5Platform}
        durationInFrames={730}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Phase6"
        component={Phase6Conclusion}
        durationInFrames={700}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

