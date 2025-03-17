import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TurboBoostCalculator = () => {
    const [ambientPressure, setAmbientPressure] = useState(14.7); // Default ambient pressure (sea level in PSIA)
    const [atmosphericBoost, setAtmosphericBoost] = useState(10); // Default atmospheric turbo boost in PSI
    const [primaryBoost, setPrimaryBoost] = useState(15); // Default primary turbo boost in PSI

    const [atmosphericRatio, setAtmosphericRatio] = useState(0);
    const [primaryRatio, setPrimaryRatio] = useState(0);
    const [chartData, setChartData] = useState<{
        atmosphericBoost: number;
        atmosphericRatio: number;
        primaryRatio: number;
        totalPressure: number;
    }[]>([]);

    // Calculate ratios when inputs change
    useEffect(() => {
        // Atmospheric turbo ratio = (ambient + atmospheric boost) / ambient
        const atmRatio = (ambientPressure + atmosphericBoost) / ambientPressure;

        // Primary turbo ratio = (ambient + atmospheric boost + primary boost) / (ambient + atmospheric boost)
        const primRatio = (ambientPressure + atmosphericBoost + primaryBoost) / (ambientPressure + atmosphericBoost);

        setAtmosphericRatio(atmRatio);
        setPrimaryRatio(primRatio);

        // Generate data for chart - showing how primary ratio changes as atmospheric boost increases
        // Limit number of data points to prevent performance issues
        const dataPoints = 15;
        const newChartData = [];
        const maxAtmBoost = Math.max(atmosphericBoost * 1.5, 1); // Ensure we have some range even if atmosphericBoost is 0

        for (let i = 0; i <= dataPoints; i++) {
            const atmBoost = (maxAtmBoost * i) / dataPoints;
            const atmRatioPoint = (ambientPressure + atmBoost) / ambientPressure;
            const primRatioPoint = (ambientPressure + atmBoost + primaryBoost) / (ambientPressure + atmBoost);

            newChartData.push({
                atmosphericBoost: parseFloat(atmBoost.toFixed(2)),
                atmosphericRatio: parseFloat(atmRatioPoint.toFixed(3)),
                primaryRatio: parseFloat(primRatioPoint.toFixed(3)),
                totalPressure: parseFloat((ambientPressure + atmBoost + primaryBoost).toFixed(2))
            });
        }
        setChartData(newChartData);
    }, [ambientPressure, atmosphericBoost, primaryBoost]);

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Compound Turbo Boost Ratio Calculator</h1>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-4 rounded shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambient Pressure (PSIA)
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="0.1"
                        className="w-full p-2 border rounded"
                        value={ambientPressure}
                        onChange={(e) => setAmbientPressure(parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Standard sea level: 14.7 PSIA</p>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Atmospheric Turbo Boost (PSI)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full p-2 border rounded"
                        value={atmosphericBoost}
                        onChange={(e) => setAtmosphericBoost(parseFloat(e.target.value))}
                    />
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Turbo Boost (PSI)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full p-2 border rounded"
                        value={primaryBoost}
                        onChange={(e) => setPrimaryBoost(parseFloat(e.target.value))}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Atmospheric Turbo</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Inlet Pressure:</p>
                            <p className="font-medium">{ambientPressure.toFixed(2)} PSIA</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Outlet Pressure:</p>
                            <p className="font-medium">{(ambientPressure + atmosphericBoost).toFixed(2)} PSIA</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Boost Created:</p>
                            <p className="font-medium">{atmosphericBoost.toFixed(2)} PSI</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pressure Ratio:</p>
                            <p className="font-medium">{atmosphericRatio.toFixed(3)}:1</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Primary Turbo</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Inlet Pressure:</p>
                            <p className="font-medium">{(ambientPressure + atmosphericBoost).toFixed(2)} PSIA</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Outlet Pressure:</p>
                            <p className="font-medium">{(ambientPressure + atmosphericBoost + primaryBoost).toFixed(2)} PSIA</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Boost Created:</p>
                            <p className="font-medium">{primaryBoost.toFixed(2)} PSI</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pressure Ratio:</p>
                            <p className="font-medium">{primaryRatio.toFixed(3)}:1</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Effect of Atmospheric Boost on Primary Turbo Ratio</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="atmosphericBoost"
                                label={{ value: 'Atmospheric Boost (PSI)', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis label={{ value: 'Pressure Ratio', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => Number(value).toFixed(3)} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="atmosphericRatio"
                                name="Atmospheric Turbo Ratio"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="primaryRatio"
                                name="Primary Turbo Ratio"
                                stroke="#82ca9d"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                    This chart demonstrates how the primary turbo's pressure ratio decreases as the atmospheric turbo creates more boost.
                    When the atmospheric turbo isn't producing any boost, the primary turbo has its highest pressure ratio.
                </p>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Total System Performance</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Boost:</p>
                        <p className="font-medium">{(atmosphericBoost + primaryBoost).toFixed(2)} PSI</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Pressure:</p>
                        <p className="font-medium">{(ambientPressure + atmosphericBoost + primaryBoost).toFixed(2)} PSIA</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Overall System Ratio:</p>
                        <p className="font-medium">
                            {((ambientPressure + atmosphericBoost + primaryBoost) / ambientPressure).toFixed(3)}:1
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TurboBoostCalculator;