import Link from "next/link"
import { Coffee, Store, MapPin, MessageSquare, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-green-50 to-amber-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Coffee className="h-16 w-16 mx-auto mb-6 text-green-600" />
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Your Coffee Community Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover the best roasteries and cafes, read reviews from fellow coffee enthusiasts, and join discussions about your favorite brews.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/roasteries">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Store className="mr-2 h-5 w-5" />
                Explore Roasteries
              </Button>
            </Link>
            <Link href="/cafes">
              <Button size="lg" variant="outline">
                <MapPin className="mr-2 h-5 w-5" />
                Find Cafes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">What Brewery Offers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Store className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Roastery Discovery</CardTitle>
                <CardDescription>
                  Find and review local and international coffee roasteries with detailed profiles and user ratings.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MapPin className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Cafe Recommendations</CardTitle>
                <CardDescription>
                  Discover the best cafes near you with honest reviews from the coffee community.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Community Discussions</CardTitle>
                <CardDescription>
                  Join discussions about brewing methods, bean origins, and everything coffee-related.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Roasteries</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRoasteries.map((roastery) => (
              <Card key={roastery.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{roastery.name}</CardTitle>
                      <CardDescription className="mt-1">{roastery.location}</CardDescription>
                    </div>
                    <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                      <span className="ml-1 text-sm font-medium">{roastery.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{roastery.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{roastery.reviewCount} reviews</span>
                    <Link href={`/roasteries/${roastery.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/roasteries">
              <Button size="lg" variant="outline">View All Roasteries</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Trending Discussions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {trendingDiscussions.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{discussion.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{discussion.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>by {discussion.author}</span>
                        <span>•</span>
                        <span>{discussion.replies} replies</span>
                        <span>•</span>
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/discussions">
              <Button size="lg">Join Discussions</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const featuredRoasteries = [
  {
    id: "1",
    name: "Common Ground Roasters",
    location: "Singapore",
    description: "Specializing in single-origin beans from Southeast Asia with a focus on sustainable sourcing.",
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "2",
    name: "Perc Coffee Roasters",
    location: "Singapore",
    description: "Award-winning roastery known for their meticulous light roasts and experimental processing methods.",
    rating: 4.7,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Nylon Coffee Roasters",
    location: "Singapore",
    description: "Pioneering the specialty coffee scene in Singapore with their unique flavor profiles.",
    rating: 4.9,
    reviewCount: 156,
  },
]

const trendingDiscussions = [
  {
    id: "1",
    title: "Best pour-over ratio for Ethiopian beans?",
    excerpt: "I've been experimenting with different ratios and would love to hear what works best for you...",
    author: "coffee_junkie",
    replies: 23,
    time: "2 hours ago",
  },
  {
    id: "2",
    title: "V60 vs Kalita Wave - which do you prefer?",
    excerpt: "Looking to upgrade my pour-over setup. Currently using a Hario V60 but curious about Kalita...",
    author: "brew_master",
    replies: 45,
    time: "5 hours ago",
  },
  {
    id: "3",
    title: "New roastery alert: Check out [Roastery Name]",
    excerpt: "Just discovered this amazing new roastery in my neighborhood. Their natural processed beans are incredible...",
    author: "bean_hunter",
    replies: 12,
    time: "1 day ago",
  },
]
