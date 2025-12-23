import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';

export const mdxComponents = {
  ...defaultMdxComponents,
  Tabs,
  Tab,
  Steps,
  Step,
  Accordions,
  Accordion,
  Files,
  File,
  Folder,
  ImageZoom,
  TypeTable,
  Callout,
  Card,
  Cards,
};
