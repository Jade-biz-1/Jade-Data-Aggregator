export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Data Aggregator Platform
        </h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-8">
          Interactive Tutorial
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          Learn to master the Data Aggregator Platform through hands-on exercises
          and real-world scenarios.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
            Start Learning
          </button>
          <button className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-blue-600 shadow-lg">
            Continue Progress
          </button>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">6 Modules</h3>
            <p className="text-gray-600">Progressive learning path from basics to advanced</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Hands-On</h3>
            <p className="text-gray-600">Interactive exercises with real API integration</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Real Scenarios</h3>
            <p className="text-gray-600">Production-ready use cases and examples</p>
          </div>
        </div>
      </div>
    </div>
  );
}
