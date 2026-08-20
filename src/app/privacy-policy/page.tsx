
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, BookText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - The Formby Commons',
  description: 'Privacy Policy for The Formby Commons.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4 shadow-md">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Effective date: 1st day of June, 2025</p>
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-8 space-y-6 text-foreground/90 leading-relaxed">
          
          <section aria-labelledby="section-type">
            <h2 id="section-type" className="font-headline text-2xl text-primary mb-3">Type of website</h2>
            <p>
              A not-for-profit community project that lets users submit and view descriptions of proposed local Actions in the UK.
            </p>
          </section>

          <section aria-labelledby="section-purpose">
            <h2 id="section-purpose" className="font-headline text-2xl text-primary mb-3">Purpose</h2>
            <p>
              The purpose of this privacy policy (this "Privacy Policy") is to inform users of our Site of the following:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>The personal data we will collect;</li>
              <li>Use of collected data;</li>
              <li>Who has access to the data collected;</li>
              <li>The rights of Site users; and</li>
              <li>The Site's cookie policy.</li>
            </ul>
            <p className="mt-2">
              This Privacy Policy applies in addition to the terms and conditions of our Site.
            </p>
          </section>

          <section aria-labelledby="section-gdpr">
            <h2 id="section-gdpr" className="font-headline text-2xl text-primary mb-3">GDPR</h2>
            <p>
              For users in the European Union, we adhere to the Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016, known as the General Data Protection Regulation (the "GDPR"). For users in the United Kingdom, we adhere to the GDPR as enshrined in the Data Protection Act 2018.
            </p>
          </section>

          <section aria-labelledby="section-consent">
            <h2 id="section-consent" className="font-headline text-2xl text-primary mb-3">Consent</h2>
            <p>
              By using our Site users agree that they consent to the conditions set out in this Privacy Policy.
            </p>
            <p className="mt-2">
              When the legal basis for us processing your personal data is that you have provided your consent to that processing, you may withdraw your consent at any time. If you withdraw your consent, it will not make processing which we completed before you withdrew your consent unlawful.
            </p>
          </section>

          <section aria-labelledby="section-legal-basis">
            <h2 id="section-legal-basis" className="font-headline text-2xl text-primary mb-3">Legal Basis for Processing</h2>
            <p>
              We collect and process personal data about users in the EU only when we have a legal basis for doing so under Article 6 of the GDPR.
            </p>
            <p className="mt-2">
              We rely on the following legal basis to collect and process the personal data of users in the EU:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>Users have provided their consent to the processing of their data for one or more specific purposes.</li>
            </ul>
          </section>

          <section aria-labelledby="section-personal-data">
            <h2 id="section-personal-data" className="font-headline text-2xl text-primary mb-3">Personal Data We Collect</h2>
            <p>
              We only collect data that helps us achieve the purpose set out in this Privacy Policy. We will not collect any additional data beyond the data listed below without notifying you first.
            </p>
            <h3 className="font-headline text-xl text-primary/90 mt-4 mb-2">Data Collected in a Non-Automatic Way</h3>
            <p>
              We may also collect the following data when you perform certain functions on our Site:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>Action description; and</li>
              <li>Sser vote on individual Actions</li>
            </ul>
            <p className="mt-2">
              This data may be collected using the provided online submission form.
            </p>
          </section>

          <section aria-labelledby="section-how-we-use">
            <h2 id="section-how-we-use" className="font-headline text-2xl text-primary mb-3">How We Use Personal Data</h2>
            <p>
              Data collected on our Site will only be used for the purposes specified in this Privacy Policy or indicated on the relevant pages of our Site. We will not use your data beyond what we disclose in this Privacy Policy.
            </p>
            <p className="mt-2">
              The data we collect when the user submits data using the online submission form may be screened, potentially edited, and published online on the Site.
            </p>
          </section>
          
          <section aria-labelledby="section-other-disclosures">
            <h2 id="section-other-disclosures" className="font-headline text-2xl text-primary mb-3">Other Disclosures</h2>
            <p>
              We will not sell or share your data with other third parties, except in the following cases:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
              <li>If the law requires it;</li>
              <li>If it is required for any legal proceeding;</li>
              <li>To prove or protect our legal rights; and</li>
            </ul>
            <p className="mt-2">
              If you follow hyperlinks from our Site to another Site, please note that we are not responsible for and have no control over their privacy policies and practices.
            </p>
          </section>

          <section aria-labelledby="section-how-long">
            <h2 id="section-how-long" className="font-headline text-2xl text-primary mb-3">How Long We Store Personal Data</h2>
            <p>
              User data will be stored until the purpose the data was collected for has been achieved.
            </p>
            <p className="mt-2">
              While we take all reasonable precautions to ensure that user data is secure and that users are protected, there always remains the risk of harm. The Internet as a whole can be insecure at times and therefore we are unable to guarantee the security of user data beyond what is reasonably practical.
            </p>
          </section>
          
          <section aria-labelledby="section-children">
            <h2 id="section-children" className="font-headline text-2xl text-primary mb-3">Children</h2>
            <p>
              We do not knowingly collect or use personal data from children under 16 years of age. If we learn that we have collected personal data from a child under 16 years of age, the personal data will be deleted as soon as possible. If a child under 16 years of age has provided us with personal data their parent or guardian may contact the owner of theformbycommons.github.io.
            </p>
          </section>

          <section aria-labelledby="section-cookie-policy">
            <h2 id="section-cookie-policy" className="font-headline text-2xl text-primary mb-3">Cookie Policy</h2>
            <p>
              A cookie is a small file, stored on a user's hard drive by a website. Its purpose is to collect data relating to the user's browsing habits. You can choose to be notified each time a cookie is transmitted. You can also choose to disable cookies entirely in your internet browser, but this may decrease the quality of your user experience.
            </p>
            <p className="mt-2">
              We only use functional cookies on our Site. Functional cookies are used to remember the selections you make on our Site so that your selections are saved for your next visits.
            </p>
          </section>

          <section aria-labelledby="section-modifications">
            <h2 id="section-modifications" className="font-headline text-2xl text-primary mb-3">Modifications</h2>
            <p>
              This Privacy Policy may be amended from time to time in order to maintain compliance with the law and to reflect any changes to our data collection process. When we amend this Privacy Policy we will update the "Effective Date" at the top of this Privacy Policy. We recommend that our users periodically review our Privacy Policy to ensure that they are notified of any updates. 
            </p>
          </section>

          <section aria-labelledby="section-contact">
            <h2 id="section-contact" className="font-headline text-2xl text-primary mb-3">Contact Information for The Formby Commons</h2>
            <p>
              https://theformbycommons.github.io (the "Site") is owned and operated by Felix Zajitschek (“owner of theformbycommons.github.io”; contact: <a href="mailto:theformbycommons@protonmail.com" className="text-accent hover:underline">theformbycommons@protonmail.com</a>).
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

    