/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { Box, Card, CardContent, Stack, Typography, Button } from '@mui/material';
import { Link } from 'react-router';

// Section definitions for the home page
const sections = [
  {
    title: 'Tokens',
    description: 'Monitor issued credentials, check archived tokens, and inspect single token payloads.',
    links: [
      { label: 'Active tokens', to: '/tokens/active', description: 'Browse every token that is currently valid.' },
      { label: 'Archived tokens', to: '/tokens/archived', description: 'Review retired entries for auditing purposes.' },
    ],
  },
  {
    title: 'Services',
    description: 'Keep service integrations up to date, register newcomers, and renew expiring credentials.',
    links: [
      { label: 'Services overview', to: '/services/overview', description: 'See every onboarded service at a glance.' },
      { label: 'Register service', to: '/services/new', description: 'Create a new service entry through certificate file.' },
    ],
  },
  {
    title: 'Routes',
    description: 'Understand the routing layer that connects services to tokenized resources and register new ones.',
    links: [
      { label: 'Routes overview', to: '/routes/overview', description: 'List the available service routes and their status.' },
    ],
  },
];

/**
 * Home page component providing an overview and navigation to main sections.
 */
export default function Home() {
  return <Box component="section" sx={{ py: 6 }}>
    <Typography variant="h3" component="h1" gutterBottom>
      Welcome to the Tokenization Control Center
    </Typography>
    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
      Start by exploring tokens, registered services, or dynamic token routes. Each shortcut below opens the relevant workspace.
    </Typography>

    <Stack spacing={3}>
      {sections.map((section) => (
        <SectionCard
          key={section.title}
          title={section.title}
          description={section.description}
          links={section.links}
        />
      ))}
    </Stack>
  </Box>;
}

interface SectionProps {
  title: string;
  description: string;
  links: { label: string; to: string; description: string }[];
}

/**
 * SectionCard component to display a section with links
 *
 * @param title Section title
 * @param description Section description
 * @param links Array of link objects with label, to, and description
 */
function SectionCard({ title, description, links }: SectionProps) {
  return <Card elevation={2}>
    <CardContent>
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {description}
      </Typography>
      <Stack spacing={2}>
        {links.map((link) => (
          <Box key={link.label} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="subtitle2">{link.label}</Typography>
              <Typography variant="body2" color="text.secondary">{link.description}</Typography>
            </Box>
            <Button component={Link} to={link.to} variant="contained" size="small">
              Open
            </Button>
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>;
}
