// lib/integrations/config.ts

export interface AppIntegration {
  id: string;
  name: string;
  icon: string;
  category: 'communication' | 'productivity' | 'ecommerce' | 'payment' | 'other';
  type?: 'trigger' | 'action' | 'both'; // New: specify if app supports triggers, actions, or both
  actions: AppAction[];
  triggers?: AppAction[]; // New: separate triggers array
}

export interface AppAction {
  id: string;
  name: string;
  description: string;
  fields: ActionField[];
}

export interface ActionField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'phone' | 'email';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

export const APP_INTEGRATIONS: AppIntegration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    category: 'communication',
    type: 'both', // Supports both triggers and actions
    // TRIGGERS for WhatsApp
    triggers: [
      {
        id: 'message_received',
        name: 'Text Message Received',
        description: 'Triggers when a message is received from WhatsApp',
        fields: [
          {
            id: 'phone_filter',
            label: 'Filter by Phone (Optional)',
            type: 'phone',
            required: false,
            placeholder: '+1234567890',
            description: 'Leave empty to trigger for all incoming messages',
          },
        ],
      },
      {
        id: 'list_reply',
        name: 'List Message Reply',
        description: 'Triggers when a list message reply button is pressed from a WhatsApp message',
        fields: [],
      },
      {
        id: 'template_button_reply',
        name: 'Template Message Button Reply',
        description: 'Triggers when a button reply is pressed from a WhatsApp template message',
        fields: [],
      },
      {
        id: 'interactive_button_reply',
        name: 'Interactive Message Button Reply',
        description: 'Triggers when a quick reply button is pressed from a WhatsApp interactive message',
        fields: [],
      },
      {
        id: 'form_response',
        name: 'Form Message Response',
        description: 'Triggers when a form message is responded to. This is typically used to capture responses from forms sent via WhatsApp',
        fields: [],
      },
    ],
    // ACTIONS for WhatsApp
    actions: [
      {
        id: 'send_message',
        name: 'Send Message',
        description: 'Send a text message to a WhatsApp number',
        fields: [
          {
            id: 'phone',
            label: 'Phone Number',
            type: 'phone',
            required: true,
            placeholder: '+919876543210',
            description: 'Enter phone number with country code (e.g., +919876543210)',
          },
          {
            id: 'message',
            label: 'Message',
            type: 'textarea',
            required: true,
            placeholder: 'Enter your message here...',
            description: 'The text message to send via WhatsApp',
          },
        ],
      },
      {
        id: 'send_template',
        name: 'Send Template',
        description: 'Send a WhatsApp template message',
        fields: [
          {
            id: 'phone',
            label: 'Phone Number',
            type: 'phone',
            required: true,
            placeholder: '+1234567890',
          },
          {
            id: 'template_name',
            label: 'Template Name',
            type: 'text',
            required: true,
            placeholder: 'hello_world',
          },
          {
            id: 'language',
            label: 'Language',
            type: 'select',
            required: true,
            options: [
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' },
              { label: 'Spanish', value: 'es' },
            ],
          },
        ],
      },
      {
        id: 'send_media',
        name: 'Send Media',
        description: 'Send an image, video, or document',
        fields: [
          {
            id: 'phone',
            label: 'Phone Number',
            type: 'phone',
            required: true,
            placeholder: '+1234567890',
          },
          {
            id: 'media_url',
            label: 'Media URL',
            type: 'text',
            required: true,
            placeholder: 'https://example.com/image.jpg',
          },
          {
            id: 'caption',
            label: 'Caption',
            type: 'textarea',
            required: false,
            placeholder: 'Optional caption',
          },
        ],
      },
      {
        id: 'wait_for_reply',
        name: 'Wait for Reply',
        description: 'Wait for user to reply',
        fields: [
          {
            id: 'timeout',
            label: 'Timeout (seconds)',
            type: 'number',
            required: true,
            placeholder: '300',
          },
        ],
      },
    ],
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: '📊',
    category: 'productivity',
    type: 'action', // Only actions, no triggers
    actions: [
      {
        id: 'add_row',
        name: 'Add Row',
        description: 'Add a new row to a Google Sheet',
        fields: [
          {
            id: 'spreadsheet_id',
            label: 'Spreadsheet ID',
            type: 'text',
            required: true,
            placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          },
          {
            id: 'sheet_name',
            label: 'Sheet Name',
            type: 'text',
            required: true,
            placeholder: 'Sheet1',
          },
          {
            id: 'values',
            label: 'Values (comma-separated)',
            type: 'textarea',
            required: true,
            placeholder: 'John Doe, john@example.com, 555-1234',
          },
        ],
      },
      {
        id: 'get_rows',
        name: 'Get Rows',
        description: 'Read rows from a Google Sheet',
        fields: [
          {
            id: 'spreadsheet_id',
            label: 'Spreadsheet ID',
            type: 'text',
            required: true,
          },
          {
            id: 'sheet_name',
            label: 'Sheet Name',
            type: 'text',
            required: true,
          },
          {
            id: 'range',
            label: 'Range',
            type: 'text',
            required: false,
            placeholder: 'A1:Z100',
          },
        ],
      },
    ],
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: '💳',
    category: 'payment',
    type: 'action',
    actions: [
      {
        id: 'create_payment_link',
        name: 'Create Payment Link',
        description: 'Generate a payment link',
        fields: [
          {
            id: 'amount',
            label: 'Amount (in paise)',
            type: 'number',
            required: true,
            placeholder: '50000',
            description: '₹500 = 50000 paise',
          },
          {
            id: 'description',
            label: 'Description',
            type: 'text',
            required: true,
            placeholder: 'Payment for order #123',
          },
          {
            id: 'customer_name',
            label: 'Customer Name',
            type: 'text',
            required: false,
          },
          {
            id: 'customer_phone',
            label: 'Customer Phone',
            type: 'phone',
            required: false,
          },
        ],
      },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    category: 'ecommerce',
    type: 'action',
    actions: [
      {
        id: 'create_order',
        name: 'Create Order',
        description: 'Create a new order in Shopify',
        fields: [
          {
            id: 'customer_email',
            label: 'Customer Email',
            type: 'email',
            required: true,
          },
          {
            id: 'line_items',
            label: 'Line Items (JSON)',
            type: 'textarea',
            required: true,
            placeholder: '[{"variant_id": 123, "quantity": 1}]',
          },
        ],
      },
      {
        id: 'get_order',
        name: 'Get Order',
        description: 'Fetch order details',
        fields: [
          {
            id: 'order_id',
            label: 'Order ID',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    icon: '📅',
    category: 'productivity',
    type: 'action',
    actions: [
      {
        id: 'create_event',
        name: 'Create Event',
        description: 'Schedule a new event',
        fields: [
          {
            id: 'event_type',
            label: 'Event Type',
            type: 'text',
            required: true,
          },
          {
            id: 'invitee_email',
            label: 'Invitee Email',
            type: 'email',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: 'webhook',
    name: 'Webhook',
    icon: '🔗',
    category: 'other',
    type: 'action',
    actions: [
      {
        id: 'send_request',
        name: 'Send HTTP Request',
        description: 'Send data to a webhook URL',
        fields: [
          {
            id: 'url',
            label: 'Webhook URL',
            type: 'text',
            required: true,
            placeholder: 'https://example.com/webhook',
          },
          {
            id: 'method',
            label: 'HTTP Method',
            type: 'select',
            required: true,
            options: [
              { label: 'POST', value: 'POST' },
              { label: 'GET', value: 'GET' },
              { label: 'PUT', value: 'PUT' },
            ],
          },
          {
            id: 'body',
            label: 'Request Body (JSON)',
            type: 'textarea',
            required: false,
            placeholder: '{"key": "value"}',
          },
        ],
      },
    ],
  },
  {
    id: 'smtp',
    name: 'Email (SMTP)',
    icon: '📧',
    category: 'communication',
    type: 'action',
    actions: [
      {
        id: 'send_email',
        name: 'Send Email',
        description: 'Send an email via SMTP',
        fields: [
          {
            id: 'to',
            label: 'To Email',
            type: 'email',
            required: true,
          },
          {
            id: 'subject',
            label: 'Subject',
            type: 'text',
            required: true,
          },
          {
            id: 'body',
            label: 'Email Body',
            type: 'textarea',
            required: true,
          },
        ],
      },
    ],
  },
];

// Helper to get integration by ID
export function getIntegrationById(id: string): AppIntegration | undefined {
  return APP_INTEGRATIONS.find((app) => app.id === id);
}

// Helper to get action by IDs
export function getActionById(appId: string, actionId: string): AppAction | undefined {
  const app = getIntegrationById(appId);
  return app?.actions.find((action) => action.id === actionId);
}