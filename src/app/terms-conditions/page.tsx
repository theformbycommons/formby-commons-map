
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions - Act Local Glow',
  description: 'Terms and Conditions for using the Act Local Glow website.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg" data-testid="terms-conditions-card">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4 shadow-md">
            <FileText className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">Terms and Conditions</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: 1 June 2025</p>
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-8 space-y-6 text-foreground/90 leading-relaxed">
          <p>
            These terms and conditions (the "Terms and Conditions") govern the use of act.localglow.uk (the "Site"). This Site is owned and operated by Felix Zajitschek (“owner of act.localglow.uk”). This Site is a not-for-profit community project that lets users submit and view descriptions of local Actions in the UK.
          </p>
          <p>
            By using this Site, you indicate that you have read and understand these Terms and Conditions and agree to abide by them at all times.
          </p>

          <section aria-labelledby="section-intellectual-property">
            <h2 id="section-intellectual-property" className="font-headline text-2xl text-primary mb-3">Intellectual Property</h2>
            <p>
              All content published and made available on our Site is the property of the owner of localglow.uk. This includes, but is not limited to images, text, logos, documents, downloadable files and anything that contributes to the composition of our Site.
            </p>
          </section>

          <section aria-labelledby="section-acceptable-use">
            <h2 id="section-acceptable-use" className="font-headline text-2xl text-primary mb-3">Acceptable Use</h2>
            <p>
              As a user of our Site, you agree to use our Site legally, not to use our Site for illegal purposes, and not to:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>Harass or mistreat other users of our Site;</li>
              <li>Violate the intellectual property rights of the Site owners or any third party to the Site;</li>
              <li>Act in any way that could be considered fraudulent; or</li>
              <li>Post any material that may be deemed inappropriate or offensive.</li>
            </ul>
            <p className="mt-2">
              If we believe you are using our Site illegally or in a manner that violates these Terms and Conditions, we reserve the right to limit, suspend or terminate your access to our Site. We also reserve the right to take any legal steps necessary to prevent you from accessing our Site.
            </p>
          </section>

          <section aria-labelledby="section-user-contributions">
            <h2 id="section-user-contributions" className="font-headline text-2xl text-primary mb-3">User Contributions</h2>
            <p>
              Users may submit the following information on our Site (“User Submissions"):
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>Action descriptions; and</li>
              <li>User votes on Actions</li>
            </ul>
            <p className="mt-2">
              By submitting information to our Site, you agree not to act illegally or violate these Terms and Conditions.
            </p>
            <p className="mt-2">
              By submitting any pictures or text ("User Submissions") to this website, you hereby grant to localglow.uk a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, and sublicensable license to use, reproduce, distribute, prepare derivative works of, and display your User Submissions on the website, including without limitation for promoting and redistributing part or all of the website (and derivative works thereof) in any media formats and through any media channels.
            </p>
            <p className="mt-2">
              You understand and agree that act.localglow.uk may, at its sole discretion, review, edit, modify, delete, or refuse to post any User Submissions for any reason, including but not limited to, User Submissions that violate these Terms and Conditions, are unlawful, offensive, or otherwise inappropriate. We reserve the right to make such changes to your User Submissions as we deem necessary or appropriate to conform to our editorial standards or the technical requirements of the website or any other media.
            </p>
            <p className="mt-2">
              You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to publish the User Submissions that you submit; and you grant to localglow.uk the license to use such User Submissions as set forth above. You further agree that you will not submit material that is copyrighted, protected by trade secret, or otherwise subject to third-party proprietary rights, including privacy and publicity rights, unless you are the owner of such rights or have permission from their rightful owner to post the material and to grant act.localglow.uk all of the license rights granted herein.
            </p>
          </section>

          <section aria-labelledby="section-limitation-liability">
            <h2 id="section-limitation-liability" className="font-headline text-2xl text-primary mb-3">Limitation of Liability</h2>
            <p>
              The owner of act.localglow.uk will not be liable for any actions, claims, losses, damages, liabilities, and expenses (including reasonable legal fees) arising from your use of this Site.
            </p>
          </section>

          <section aria-labelledby="section-indemnity">
            <h2 id="section-indemnity" className="font-headline text-2xl text-primary mb-3">Indemnity</h2>
            <p>
              Except where prohibited by law, by using this Site you indemnify and hold harmless the owner of act.localglow.uk from any actions, claims, losses, damages, liabilities and expenses including legal fees arising out of your use of our Site or your violation of these Terms and Conditions.
            </p>
          </section>

          <section aria-labelledby="section-applicable-law">
            <h2 id="section-applicable-law" className="font-headline text-2xl text-primary mb-3">Applicable Law</h2>
            <p>
              These Terms and Conditions are governed by the laws of the Country of England.
            </p>
          </section>

          <section aria-labelledby="section-severability">
            <h2 id="section-severability" className="font-headline text-2xl text-primary mb-3">Severability</h2>
            <p>
              If at any time any of the provisions set forth in these Terms and Conditions are found to be inconsistent or invalid under applicable laws, those provisions will be deemed void and will be removed from these Terms and Conditions. All other provisions will not be affected by the removal and the rest of these Terms and Conditions will still be considered valid.
            </p>
          </section>

          <section aria-labelledby="section-changes">
            <h2 id="section-changes" className="font-headline text-2xl text-primary mb-3">Changes</h2>
            <p>
              These Terms and Conditions may be amended from time to time in order to maintain compliance with the law and to reflect any changes to the way we operate our Site and the way we expect users to behave on our Site. We will notify users by email of changes to these Terms and Conditions or post a notice on our Site.
            </p>
          </section>

          <section aria-labelledby="section-contact-details">
            <h2 id="section-contact-details" className="font-headline text-2xl text-primary mb-3">Contact Details</h2>
            <p>
              Please contact us if you have any questions or concerns. Our contact details are as follows:
            </p>
            <p>
              <a href="mailto:localglowuk@gmail.com" className="text-accent hover:underline">localglowuk@gmail.com</a>
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

    