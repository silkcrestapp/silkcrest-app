export function racecourseJpConvert(racecourse: string): { jpName: string} {
    const racecourseMap: Record<string, { jpName: string }> = {
        'Tokyo':        { jpName: '東京' },
        'Kyoto':        { jpName: '京都' },
        'Nakayama':     { jpName: '中山' },
        'Hanshin':      { jpName: '阪神' },
        'Chukyo':       { jpName: '中京' },
        'Sapporo':      { jpName: '札幌' },
        'Hakodate':     { jpName: '函館' },
        'Fukushima':    { jpName: '福島' },
        'Niigata':      { jpName: '新潟' },
        'Kokura':       { jpName: '小倉' }
    };

    return racecourseMap[racecourse] || { jpName: racecourse };
}