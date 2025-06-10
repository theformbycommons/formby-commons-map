
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'About Local Glow',
  description: 'The idea and vision behind the Local Glow project.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4 shadow-md">
            <BookOpenText className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">The Idea Behind Local Glow</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-8 space-y-6 text-foreground/90 leading-relaxed">
          <section aria-labelledby="section-introduction">
            <h2 id="section-introduction" className="font-headline text-2xl text-primary mb-3">Our Changing World, Our Constant Places</h2>
            <p className="mb-4">
              We live in an ever-changing world, where the places that shape us often feel like they're in flux, or even at risk of disappearing. But instead of focusing on what might be lost, imagine a space where we can celebrate the profound connections we have to our hometowns.
            </p>
            <p>
              This web project is born from a desire to foster positive reflection and build a community around the places that hold deep personal significance. It's about realizing that characteristics of the places we live in – the streets, parks, buildings, and natural landscapes – are deeply connected to our emotions and who we've become.
            </p>
          </section>

          <section aria-labelledby="section-sharing-stories">
            <h2 id="section-sharing-stories" className="font-headline text-2xl text-primary mb-3">Sharing Stories, Building Community</h2>
            <p className="mb-4">
              This platform is an invitation to explore and share the unique corners of your hometown that resonate with your individual story. Whether it's the ancient oak in the town square where you first learned to ride a bike, the bustling market street where generations of your family have shopped, or the hidden riverbend where you found solace, with every location we share, we build a deeper, more vibrant community picture.
            </p>
            <p>
              We believe that by collectively acknowledging and celebrating these personal geographies, we can build a shared base for community, fostering a sense of belonging among diverse individuals.
            </p>
          </section>

          <section aria-labelledby="section-identity-place">
            <h2 id="section-identity-place" className="font-headline text-2xl text-primary mb-3">Identity, Place, and Well-being</h2>
            <p className="mb-4">
              Our approach embraces the idea that identity is deeply intertwined with place, not in a rigid or exclusive way, but as a fluid and evolving relationship. As Richard Louv, author of "Last Child in the Woods," eloquently argues, our connection to place, particularly to nature, is fundamental to our well-being and sense of self. However, we extend this idea to encompass all aspects of our surroundings, recognizing that both urban environments and natural landscapes contribute equally to our personal narratives and collective identity.
            </p>
            <p>
              The positive memories attached to an interesting building or a bench in a local residential neighbourhood are just as valid as the peace discovered in a local greenspace or natural area when it comes to forming our sense of self and belonging.
            </p>
          </section>
          
          <section aria-labelledby="section-third-places">
            <h2 id="section-third-places" className="font-headline text-2xl text-primary mb-3">The Spirit of "Third Places"</h2>
            <p className="mb-4">
              This project also resonates with the work of thinkers like sociologist Ray Oldenburg, who, in "The Great Good Place," emphasizes the importance of "third places"—informal gathering spots that are vital for community life and personal well-being, distinct from home and work.
            </p>
            <p>
              While our website isn't a physical third place, it aims to digitally capture and amplify the spirit of these meaningful locations, allowing users to share their own "great good places" and connect with others who feel similarly. By highlighting these personally relevant spots, we contribute to a collective understanding of what makes a place meaningful, fostering a deeper appreciation for the rich and varied environments that shape our identities and bind us together as a community.
            </p>
          </section>

          <section aria-labelledby="section-non-profit-mission">
            <h2 id="section-non-profit-mission" className="font-headline text-2xl text-primary mb-3">A Passion Project</h2>
            <p className="mb-4">
              At its heart, this web app is a passion non-profit project, created in Formby, Northwest England, within the vibrant Liverpool City Region. This endeavour has never been, nor will it ever be, about financial gain or commercial ventures.
            </p>
            <p>
              You won't find any advertising here, and it's not designed to be a tourist website or a platform for political agendas. Instead, it's driven purely by a deep love of place, a commitment to community building, and a desire to bridge divides across all age groups, from the young to the old.
            </p>
          </section>

          <section aria-labelledby="section-vision">
            <h2 id="section-vision" className="font-headline text-2xl text-primary mb-3">Our Vision for Stronger Communities</h2>
            <p className="mb-4">
              We believe in conserving and revitalizing the good things that foster strong local communities. This web project is a call for a vision where the best of our past can be combined with a future we actively shape together.
            </p>
            <p>
              By embracing new ideas in a democratic, transparent, and community-oriented way, we can grow stronger, and this web project hopes to be a small but helpful mosaic piece supporting that view.
            </p>
          </section>
          
          <div className="pt-6 text-center">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
