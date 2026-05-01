import { z } from "zod";


export const TRAFFIC_LIGHT = {
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    RED: "RED",
} as const;

export const TRAFFIC_LIGHT_VALUES = Object.values(TRAFFIC_LIGHT);

export const trafficLightSchema = z.enum([
    TRAFFIC_LIGHT.GREEN,
    TRAFFIC_LIGHT.YELLOW,
    TRAFFIC_LIGHT.RED,
]);

export type TrafficLight = z.infer<typeof trafficLightSchema>;