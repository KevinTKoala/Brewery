import { notFound } from "next/navigation"
import { Star, MapPin, Phone, Globe, ExternalLink, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { roasteries, reviews } from "@/lib/data"

export default function RoasteryDetailPage({ params }: { params: { id: string } }) {
  const roastery = roasteries.find((r) => r.id === params.id)

  if (!roastery) {
    notFound()
  }

  const roasteryReviews = reviews.filter((r) => r.targetId === params.id && r.targetType === "roastery")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{roastery.name}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">{roastery.location}</span>
                </div>
              </div>
              <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                <span className="ml-2 text-2xl font-bold">{roastery.rating}</span>
                <span className="ml-2 text-gray-600">({roastery.reviewCount})</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {roastery.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <p className="text-gray-700 text-lg mb-6">{roastery.description}</p>

            <div className="flex flex-wrap gap-4">
              {roastery.website && (
                <a
                  href={roastery.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-700"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  Visit Website
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
              {roastery.phone && (
                <a
                  href={`tel:${roastery.phone}`}
                  className="flex items-center text-gray-600 hover:text-gray-700"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  {roastery.phone}
                </a>
              )}
            </div>

            {roastery.address && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-700">{roastery.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reviews ({roasteryReviews.length})</h2>
            <Button className="bg-green-600 hover:bg-green-700">Write a Review</Button>
          </div>

          {roasteryReviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {roasteryReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{review.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">by {review.userName}</p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? "text-yellow-600 fill-yellow-600"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{review.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {review.helpfulCount} Helpful
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
