import { Box, Link, List, ListItem, ListItemText, Typography } from '@mui/material'
import PageHeading from '../../components/UI/heading/PageHeading'

const TermsOfService = () => {
  return (
    <Box sx={{ py: 2 }}>
      <PageHeading title="Terms of Service" />

      {/* Account Terms */}
      <Typography variant="h6" mt={3} gutterBottom>
        Account Terms
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You must be 18 years or older to use this Service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You must provide your full legal name, current address, a valid email address, and any other information needed in order to complete the signup process." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You are responsible for keeping your password secure. PunjabShip cannot and will not be liable for any loss or damage from your failure to maintain the security of your account and password." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You may not use the PunjabShip service for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws) as well as the laws of India." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You are responsible for all activity and content (data, graphics, photos, links) that is uploaded under your PunjabShip account." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You must not transmit any worms or viruses or any code of a destructive nature." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="A breach or violation of any of the Account Terms as determined in the sole discretion of PunjabShip will result in an immediate termination of your services." />
        </ListItem>
      </List>

      {/* General Conditions */}
      <Typography variant="h6" mt={3} gutterBottom>
        General Conditions
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You must read, agree with and accept all of the terms and conditions contained in this User Agreement and the Privacy Policy before you may become a member of PunjabShip." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="We reserve the right to modify or terminate the Service for any reason, without notice at any time." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="We reserve the right to refuse service to anyone for any reason at any time." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Your use of the Service is at your sole risk. The Service is provided on an “as is” and “as available” basis without any warranty or condition, express, implied or statutory." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip does not warrant that the service will be uninterrupted, timely, secure, or error-free." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip does not warrant that the results that may be obtained from the use of the service will be accurate or reliable." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You understand that your Content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="We may, but have no obligation to, remove Content and Accounts containing Content that we determine in our sole discretion are unlawful, offensive, threatening, libellous, defamatory, pornographic, obscene or otherwise objectionable or violates any party’s intellectual property or these Terms of Service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip does not warrant that the quality of any products, services, information, or other material purchased or obtained by you through the Service will meet your expectations, or that any errors in the Service will be corrected." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You expressly understand and agree that PunjabShip shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses resulting from the use of or inability to use the service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="In no event shall PunjabShip or our suppliers be liable for lost profits or any special, incidental or consequential damages arising out of or in connection with our site, our services or this agreement (however arising including negligence). You agree to indemnify and hold us and (as applicable) our parent, subsidiaries, affiliates, PunjabShip partners, officers, directors, agents, and employees, harmless from any claim or demand, including reasonable attorneys’ fees, made by any third party due to or arising out of your breach of this Agreement or the documents it incorporates by reference, or your violation of any law or the rights of a third party." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                Technical support is only provided to paying account holders and is only available
                via email (<Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>) and the
                request ticketing system.
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, use of the Service, or access to the Service without the express written permission by PunjabShip." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Verbal or written abuse of any kind (including threats of abuse or retribution) of any PunjabShip customer, employee, member, or officer will result in immediate account termination." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="We do not claim any intellectual property rights over the material you provide to the PunjabShip service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="By uploading images and item description content to PunjabShip, you agree to allow other internet users to view them and you agree to allow PunjabShip to display and store them and you agree that PunjabShip can, at any time, review all the content submitted by you to its Service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="The failure of PunjabShip to exercise or enforce any right or provision of the Terms of Service shall not constitute a waiver of such right or provision. The Terms of Service constitutes the entire agreement between you and PunjabShip and govern your use of the Service, superseding any prior agreements between you and PunjabShip (including, but not limited to, any prior versions of the Terms of Service)." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You shall not purchase search engine or other pay per click keywords (such as Google AdWords), or domain names that use PunjabShip trademarks and/or variations and misspellings thereof." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip does not pre-screen Content and it is in their sole discretion to refuse or remove any Content that is available via the Service." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                Questions about the Terms of Service should be sent to:{' '}
                <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>
              </>
            }
          />
        </ListItem>
      </List>

      {/* Payment of Fees */}
      <Typography variant="h6" mt={3} gutterBottom>
        Payment of Fees
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="There are different payment term options available, and depending on the payment term decided with PunjabShip, the merchant has to pay on the pre-decided monthly, quarterly, half-yearly or yearly terms." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="The merchant has to pay within 7 days from the date of Invoice, or he/she risks the chance of closure/termination of the online store." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="All fees are exclusive of all state and central taxes, service, sales tax or other taxes, fees or charges now in force or enacted in the future (“Taxes”)." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip does not provide refunds." />
        </ListItem>
      </List>

      {/* Cancellation and Termination */}
      <Typography variant="h6" mt={3} gutterBottom>
        Cancellation and Termination
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Once your account is cancelled all of your Content will be immediately deleted from the Service. Since deletion of all data is final please be sure that you do in fact want to cancel your account before doing so." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="We reserve the right to modify or terminate the PunjabShip service for any reason, without notice at any time." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Fraud: Without limiting any other remedies, PunjabShip may suspend or terminate your account if we suspect that you (by conviction, settlement, insurance or escrow investigation, or otherwise) have engaged in fraudulent activity in connection with the Site." />
        </ListItem>
      </List>

      {/* Modifications */}
      <Typography variant="h6" mt={3} gutterBottom>
        Modifications to the Service and Prices
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Prices for using PunjabShip are subject to change upon 14 days’ notice from PunjabShip. Such notice may be provided at any time by posting the changes to the PunjabShip Site or via an announcement." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip reserves the right at any time to modify or discontinue the Service (or any part thereof) with or without notice." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip shall not be liable to you or to any third party for any modification, price change, suspension or discontinuance of the Service." />
        </ListItem>
      </List>

      {/* Banned & Restricted */}
      <Typography variant="h6" mt={3} gutterBottom>
        Banned & Restricted Products and Services
      </Typography>
      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="You shall not, directly or indirectly, offer, attempt to offer, trade or attempt to trade in any item, the dealing of which is prohibited or restricted in any manner under the provisions of any applicable law, rule, regulation or guideline for the time being in force." />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                Without prejudice to the generality of the above, PunjabShip does not permit hosting
                of the following items:
                <List sx={{ listStyleType: 'circle', pl: 4 }}>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="“Securities” within the meaning of the Securities Contract Regulation Act, 1956, including shares, bonds, debentures, etc. and/or any other financial instruments/assets of any description." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="Living, dead creatures and/or the whole or any part of any animal which has been kept or preserved by any means whether artificial or natural including rugs, skins, specimens of animals, antlers, horns, hair, feathers, nails, teeth, musk, eggs, nests, other animal products prohibited under The Wildlife Protection Act, 1972." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="Weapons of any description." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="Liquor, tobacco products, drugs, psychotropic substances, narcotics, intoxicants of any description, medicines, palliative/curative substances." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="Religious items, including books, artifacts, etc. of any description or any other such item which is likely to affect the religious sentiments of any person." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="“Antiquities” and “Art Treasures” in violation of the provisions of the Antiquities and Art Treasures Act, 1972." />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item' }}>
                    <ListItemText primary="Used cellular phone SIM Cards." />
                  </ListItem>
                </List>
              </>
            }
          />
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Furthermore, you agree to display and adhere to a terms of use or other user-type agreement, as well as a privacy policy, governing your operation of your store and your conduct with your store’s customers." />
        </ListItem>
      </List>
    </Box>
  )
}

export default TermsOfService
