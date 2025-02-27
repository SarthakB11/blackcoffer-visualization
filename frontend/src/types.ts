export interface FilterState {
    end_year?: string;
    topic?: string;
    sector?: string;
    region?: string;
    pest?: string;
    source?: string;
    country?: string;
    city?: string;
}

export interface Metrics {
    total_records: number;
    avg_intensity: number;
    avg_likelihood: number;
    avg_relevance: number;
}

export interface DataItem {
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