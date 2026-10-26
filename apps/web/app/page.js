export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            RecipeHelper
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Capture recipes from photos, manage ingredients, and organize your
            favorite dishes — all in one place.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Capture Recipes
            </h3>
            <p className="text-gray-600">
              Take a photo of any recipe and let AI extract the ingredients and
              instructions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Search & Filter
            </h3>
            <p className="text-gray-600">
              Find recipes by ingredient, cuisine, or tag. Organize your
              collection effortlessly.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">☁️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sync Everywhere
            </h3>
            <p className="text-gray-600">
              Your recipes sync across all your devices. Access them anywhere,
              anytime.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-600 mb-6">
              Available for iOS and Android. Download the app and start saving
              your favorite recipes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/app"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Open Web App
            </a>
            <a
              href="https://github.com/amarks07/RecipeHelper"
              className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-8 rounded-lg transition"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-8 border-t border-gray-300">
          <p className="text-gray-600 text-sm">
            RecipeHelper — Built with React Native, Supabase, and Next.js
          </p>
        </div>
      </div>
    </main>
  );
}
