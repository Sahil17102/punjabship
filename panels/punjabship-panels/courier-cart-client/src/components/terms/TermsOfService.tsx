import { Container, Link, Typography } from '@mui/material'

const TermsOfService = () => {
  return (
    <Container maxWidth="lg">
      {/* Account Terms */}
      <Typography variant="h5" mt={3}>
        Account Terms
      </Typography>
      <ul>
        <li>You must be 18 years or older to use this Service.</li>
        <li>
          You must provide your full legal name, current address, a valid email address, and any
          other information needed in order to complete the signup process.
        </li>
        <li>
          You are responsible for keeping your password secure. PunjabShip cannot and will not be
          liable for any loss or damage from your failure to maintain the security of your account
          and password.
        </li>
        <li>
          You may not use the PunjabShip service for any illegal or unauthorized purpose nor may you
          violate any laws in your jurisdiction (including copyright laws) as well as the laws of
          India.
        </li>
        <li>
          You are responsible for all activity and content (data, graphics, photos, links) uploaded
          under your PunjabShip account.
        </li>
        <li>You must not transmit any worms or viruses or any code of a destructive nature.</li>
        <li>
          A breach or violation of any Account Terms may result in immediate termination of your
          services.
        </li>
      </ul>

      {/* General Conditions */}
      <Typography variant="h5" mt={3}>
        General Conditions
      </Typography>
      <ul>
        <li>
          You must read, agree with, and accept all terms and conditions contained in this User
          Agreement and the Privacy Policy before becoming a member of PunjabShip.
        </li>
        <li>
          We reserve the right to modify or terminate the Service for any reason, without notice at
          any time.
        </li>
        <li>We reserve the right to refuse service to anyone for any reason at any time.</li>
        <li>
          Your use of the Service is at your sole risk. The Service is provided on an “as is” and
          “as available” basis without any warranty or condition.
        </li>
        <li>
          PunjabShip does not warrant that the service will be uninterrupted, timely, secure, or
          error-free.
        </li>
        <li>
          PunjabShip does not warrant that the results obtained from the use of the service will be
          accurate or reliable.
        </li>
        <li>
          Content may be transferred unencrypted and involve transmissions over networks and
          devices.
        </li>
        <li>
          We may remove content we determine to be unlawful, offensive, or in violation of these
          Terms of Service.
        </li>
        <li>
          PunjabShip shall not be liable for any direct, indirect, incidental, special, or
          consequential damages.
        </li>
        <li>
          Technical support is only provided to paying account holders via email or agreed phone
          contact.
        </li>
        <li>
          You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service
          without permission.
        </li>
        <li>Verbal or written abuse of any kind will result in immediate account termination.</li>
        <li>
          We do not claim intellectual property rights over your material uploaded to the Service.
        </li>
        <li>
          By uploading content, you agree to allow other users to view and PunjabShip to store and
          review it.
        </li>
        <li>Failure to exercise any right does not constitute a waiver of that right.</li>
        <li>The Terms of Service constitute the entire agreement between you and PunjabShip.</li>
        <li>You shall not purchase keywords or domains infringing on PunjabShip trademarks.</li>
        <li>PunjabShip may refuse or remove any content at its discretion.</li>
        <li>
          Questions about Terms of Service should be sent to{' '}
          <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>
        </li>
      </ul>

      {/* Payment of Fees */}
      <Typography variant="h5" mt={3}>
        Payment of Fees
      </Typography>
      <ul>
        <li>
          There are different payment term options; merchants must pay according to the agreed
          monthly, quarterly, half-yearly, or yearly terms.
        </li>
        <li>
          Payment must be made within 7 days from the invoice date to avoid closure/termination of
          the online store.
        </li>
        <li>All fees are exclusive of applicable taxes, fees, or charges.</li>
        <li>PunjabShip does not provide refunds.</li>
      </ul>

      {/* Cancellation and Termination */}
      <Typography variant="h5" mt={3}>
        Cancellation and Termination
      </Typography>
      <ul>
        <li>
          Once your account is cancelled, all content will be immediately deleted. Deletion is
          final.
        </li>
        <li>We reserve the right to modify or terminate the Service at any time without notice.</li>
        <li>Fraudulent activity may result in suspension or termination of your account.</li>
      </ul>

      {/* Modifications to Service */}
      <Typography variant="h5" mt={3}>
        Modifications to the Service and Prices
      </Typography>
      <ul>
        <li>Prices may change with 14 days’ notice via posting on the site or announcement.</li>
        <li>PunjabShip reserves the right to modify or discontinue the Service at any time.</li>
        <li>
          PunjabShip shall not be liable for any modification, price change, suspension, or
          discontinuance.
        </li>
      </ul>

      {/* Banned & Restricted Products */}
      <Typography variant="h5" mt={3}>
        Banned Restricted Products and Services
      </Typography>
      <ul>
        <li>
          You shall not offer, attempt to offer, trade, or attempt to trade any prohibited or
          restricted items.
        </li>
        <li>
          PunjabShip does not permit hosting of the following:
          <ul>
            <li>
              “Securities” including shares, bonds, debentures, or other financial instruments.
            </li>
            <li>
              Living or dead creatures or parts thereof prohibited under Wildlife Protection Act,
              1972.
            </li>
            <li>Weapons of any description.</li>
            <li>Liquor, tobacco, drugs, narcotics, or medicines.</li>
            <li>Religious items affecting religious sentiments.</li>
            <li>“Antiquities” and “Art Treasures” prohibited under law.</li>
            <li>Used cellular phone SIM Cards.</li>
          </ul>
        </li>
        <li>
          Merchants must display and adhere to a user agreement and privacy policy governing their
          store.
        </li>
      </ul>
    </Container>
  )
}

export default TermsOfService
