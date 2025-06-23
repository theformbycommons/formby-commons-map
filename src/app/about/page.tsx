
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'About Act Local Glow',
  description: 'The idea and vision behind the Act Local Glow project.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4 shadow-md">
            <BookOpenText className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">The Idea Behind Act Local Glow</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-8 space-y-6 text-foreground/90 leading-relaxed">
          <section aria-labelledby="section-introduction">
            <h2 id="section-introduction" className="font-headline text-2xl text-primary mb-3">The Power of Grassroots: Building Stronger Communities Together</h2>
            <p className="mb-4">
    Act Local Glow provides a constructive online space where communities can share their ideas, and turn visions into real local change. We believe that the most meaningful improvements often start at the grassroots level – with the people who know their local areas best and are driven to make them better.</p>
 <p>Our communities aren't fixed; they're living, changing spaces shaped by the people who live in them. While top-down solutions often miss the mark, Act Local Glow champions a more direct, democratic approach, empowering citizens to explore community support.</p>
 
          </section>

          <section aria-labelledby="section-from-ideas-to-impact">
            <h2 id="section-from-ideas-to-impact" className="font-headline text-2xl text-primary mb-3">From Ideas to Impact: Fostering Citizen Action</h2>
            <p className="mb-4">
 Act Local Glow builds on the foundation of celebrating local connections, much like our sister site, Local Glow (localglow.uk). While Local Glow highlights the valued aspects of our towns, Act Local Glow takes things in a slightly different direction: it's a space for action. This platform invites you to turn insights into initiatives, providing a public forum to share and gather support for projects that aim to improve our shared spaces and collective well-being.
            </p>
 <p>
 Whether it's a proposal for a new community garden, a plan to revitalize a neglected public space, or an idea for making key community spots easier to reach on foot or by bike, Act Local Glow helps these ideas gain traction. Users can upload and describe their proposed projects and, importantly, gather public votes of support. 
            </p>
<p style={{ marginTop: '12px' }}>
This public endorsement provides a clear measure of community backing, which can be a powerful tool for those considering formal petitions, seeking local government engagement, or directly launching projects. This approach aligns with the idea of local engagement, where community members actively shape their environment, rather than passively receiving change (Irvin & Stansbury, 2004).
            </p>
          </section>

          <section aria-labelledby="section-cultivating-collective-strength">
            <h2 id="section-cultivating-collective-strength" className="font-headline text-2xl text-primary mb-3">Cultivating Collective Strength and Bridging Divides</h2>
            <p className="mb-4">
 Our approach is based on the understanding that a sense of collective efficacy – the shared belief in a group's ability to successfully organize and carry out actions to achieve common goals – is vital for community development (Bandura, 1991). By offering a platform for direct engagement and visible support for local projects, Act Local Glow aims to foster this collective strength, showing that individual actions, amplified by community backing, can lead to significant positive change.
            </p>
            <p>
 Furthermore, Act Local Glow seeks to bridge divides across different groups and viewpoints. By focusing on concrete, local improvements, the platform encourages collaborative thinking and helping to build a sense of shared purpose, moving beyond potential differences. It's about finding common ground in the desire for a better hometown, fostering a sense of shared ownership and responsibility for the local space and environment.
            </p>
          </section>
          
          <section aria-labelledby="section-catalyst-for-democratic-innovation">
            <h2 id="section-catalyst-for-democratic-innovation" className="font-headline text-2xl text-primary mb-3">A Catalyst for Democratic Innovation</h2>
            <p className="mb-4">
 This project demonstrates how digital tools can facilitate democratic innovation at the local level. While not replacing traditional forms of civic engagement, Act Local Glow complements them by providing an accessible, transparent, and user-friendly space for brainstorming and mobilization. It aligns with growing research on digital democracy and how online platforms can boost citizen participation and influence local governance (Susha & Janssen, 2017).
            </p>
            <p>
 Born from the same passion for place and community as Local Glow, Act Local Glow is a non-profit endeavour. It is free from advertising and commercial interests, driven solely by the desire to empower communities and facilitate positive change from the ground up. We believe that by providing a platform where local ideas can gain collective momentum, we can help create more responsive and democratic local communities.
            </p>
          </section>

          <section aria-labelledby="section-non-profit-mission">
            <h2 id="section-non-profit-mission" className="font-headline text-2xl text-primary mb-3">References</h2>
            <p className="mb-4">
 <ul>
 <li style={{ marginBottom: '10px' }}>
 Bandura, A. (1991). Social cognitive theory of self-regulation. Organizational Behavior and Human Decision Processes, 50(2), 248-287.
 </li>
 <li style={{ marginBottom: '10px' }}>
 Irvin, R. A., & Stansbury, J. (2004). Citizen participation in decision making: Is it worth the effort?. Public Administration Review, 64(1), 55-65.
 </li>
 <li style={{ marginBottom: '0' }}>
 Susha, I., & Janssen, M. (2017). Explaining the impact of open data: The case of digital democracy. Government Information Quarterly, 34(4), 743-755.
 </li>
 </ul>
 </p>
            <p>
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
