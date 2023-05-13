interface valuableBody {
    bodyId: number,
    bodyName: string,
    distance: number,
    valueMax: number,
}

export interface systemEstimatedValue {
    id: number,
    id64: number,
    name: string,
    url: string,
    estimatedValue: number,
    estimatedValueMapped: number,
    valuableBodies: valuableBody[]
}