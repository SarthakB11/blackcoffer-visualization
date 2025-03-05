export interface FilterState {
    end_year: string;
    topic: string;
    sector: string;
    region: string;
    pest: string;
    source: string;
    country: string;
    city: string;
}

export interface Metrics {
    total_records: number;
    avg_intensity: number;
    avg_likelihood: number;
    avg_relevance: number;
}

export interface DataItem {
    id: number;
    end_year: string;
    intensity: number;
    sector: string;
    topic: string;
    insight: string;
    url: string;
    region: string;
    start_year: string;
    impact: string;
    added: string;
    published: string;
    country: string;
    relevance: number;
    pestle: string;
    source: string;
    title: string;
    likelihood: number;
}

// New types for D3.js visualizations

export interface TimeSeriesDataPoint {
    date: string;
    value: number;
    topic?: string;
    sector?: string;
    region?: string;
}

export type TimeSeriesData = TimeSeriesDataPoint[];

export interface NetworkNode {
    id: string;
    name: string;
    type: string;
    value: number;
}

export interface NetworkLink {
    source: string;
    target: string;
    value: number;
}

export interface NetworkData {
    nodes: NetworkNode[];
    links: NetworkLink[];
}

export interface GeoDataPoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    value: number;
    country: string;
    region: string;
}

export type GeoData = GeoDataPoint[];

export interface TopicDistributionNode {
    name: string;
    value?: number;
    children?: TopicDistributionNode[];
}

export interface TopicDistributionData extends TopicDistributionNode {
    children: TopicDistributionNode[];
}