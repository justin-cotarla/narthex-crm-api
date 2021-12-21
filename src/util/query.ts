const buildSetClause = (conditions: Record<string, unknown>): string => {
    const setClause = Object.entries(conditions)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => `${key} = ?`);

    return setClause.join(',\n');
};

export { buildSetClause };
