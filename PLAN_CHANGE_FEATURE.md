# Plan Change Feature Documentation

## Overview
The Plan Change feature allows users to switch between different subscription tiers and billing cadences directly within the application, with clear confirmation screens and proration policies.

## Components

### 1. PlanChangeModal (`src/components/PlanChangeModal.tsx`)
A comprehensive modal component that handles plan changes with the following features:

#### Features
- **Plan Selection**: Visual selection of available plans (Credit Refresh, Credit Rebuild, Couples Advantage)
- **Billing Options**: Choice between full payment and monthly payment plans
- **Plan Comparison**: Side-by-side comparison of current vs new plan
- **Proration Policy Display**: Clear explanation of pricing changes and billing implications
- **Confirmation Flow**: Two-step process with selection and confirmation screens

#### Key Functions
- `handlePlanSelect(planId)`: Sets the selected plan
- `handleBillingSelect(billing)`: Sets the billing cycle preference
- `calculatePriceChange()`: Computes upgrade/downgrade pricing differences
- `handleConfirm()`: Executes the plan change via API call

#### Proration Logic
- **Upgrades**: Immediate prorated charge for the difference
- **Downgrades**: Credit applied at end of current billing period
- **Lateral Moves**: Billing cycle changes only, no price impact

### 2. Dashboard Integration (`src/pages/Dashboard.tsx`)
Enhanced dashboard with plan management capabilities:

#### New UI Elements
- **"Change Plan" Button**: Primary action for in-app plan changes
- **"Billing Portal" Button**: Secondary action linking to Stripe portal
- **Plan Status Display**: Enhanced current plan information

#### Key Functions
- `handlePlanChange(newPlanId, billingCycle)`: Main plan change handler
- `getCurrentPlanForModal()`: Converts dashboard data to modal format
- **State Management**: Added `showPlanChangeModal` and `planChangeLoading` states

### 3. API Endpoint (`api/change-plan.js`)
Serverless function handling plan changes via Stripe API:

#### Features
- **Authentication**: Firebase token verification
- **Plan Validation**: Validates plan IDs and billing cycles
- **Stripe Integration**: Updates subscriptions with proration
- **Error Handling**: Comprehensive error responses for different failure scenarios

#### Request Format
```json
{
  "newPlanId": "credit-refresh|credit-rebuild|couples-advantage",
  "billingCycle": "full|monthly"
}
```

#### Response Format
```json
{
  "success": true,
  "subscriptionId": "sub_xxxxx",
  "status": "active",
  "message": "Plan change successful"
}
```

## Plan Configuration

### Available Plans
1. **Credit Refresh**
   - Full: $800
   - Monthly: $200 setup + $123/month × 9 months
   - Target: Quick wins and focused cleanup

2. **Credit Rebuild** (Recommended)
   - Full: $1,200
   - Monthly: $300 setup + $156/month × 9 months
   - Target: Comprehensive credit repair

3. **Couples Advantage**
   - Full: $2,000
   - Monthly: $450 setup + $228/month × 9 months
   - Target: Couples building credit together

### Stripe Price Mapping
The system maps plan names to Stripe Price IDs:
```javascript
const PRICE_IDS = {
  "credit-refresh": {
    full: process.env.STRIPE_PRICE_REFRESH_FULL,
    deposit: process.env.STRIPE_PRICE_REFRESH_DEPOSIT,
    monthly: process.env.STRIPE_PRICE_REFRESH_MONTHLY,
  },
  // ... other plans
}
```

## User Experience Flow

### 1. Plan Change Initiation
- User clicks "Change Plan" button on dashboard
- Modal opens with current plan highlighted
- All available plans displayed with features and pricing

### 2. Plan Selection
- User selects new plan from visual grid
- Billing options presented (full vs monthly)
- Real-time price comparison shown

### 3. Confirmation
- Summary view with current vs new plan
- Proration policy explanation
- Final confirmation required

### 4. Processing
- API call to change-plan endpoint
- Stripe subscription update
- Firebase user data update
- Dashboard refresh with new plan information

## Technical Implementation

### State Management
```typescript
const [showPlanChangeModal, setShowPlanChangeModal] = useState(false)
const [planChangeLoading, setPlanChangeLoading] = useState(false)
```

### Error Handling
- Network errors with retry suggestions
- Stripe-specific error handling
- User-friendly error messages
- Graceful fallbacks to billing portal

### Security
- Firebase authentication required
- Server-side token verification
- Stripe customer validation
- Plan ID validation

## Environment Variables Required
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_REFRESH_FULL=price_...
STRIPE_PRICE_REFRESH_DEPOSIT=price_...
STRIPE_PRICE_REFRESH_MONTHLY=price_...
STRIPE_PRICE_REBUILD_FULL=price_...
STRIPE_PRICE_REBUILD_DEPOSIT=price_...
STRIPE_PRICE_REBUILD_MONTHLY=price_...
STRIPE_PRICE_COUPLES_FULL=price_...
STRIPE_PRICE_COUPLES_DEPOSIT=price_...
STRIPE_PRICE_COUPLES_MONTHLY=price_...
```

## Testing Considerations

### Unit Tests
- Plan selection logic
- Price calculation functions
- Modal state management

### Integration Tests
- API endpoint functionality
- Stripe subscription updates
- Firebase data persistence

### User Acceptance Tests
- Complete plan change flow
- Error scenario handling
- Mobile responsiveness

## Future Enhancements

### Planned Features
1. **Plan Recommendations**: AI-driven plan suggestions based on user profile
2. **Usage Analytics**: Track plan change patterns
3. **A/B Testing**: Test different modal designs and flows
4. **Cancellation Flow**: In-app subscription cancellation
5. **Plan Previews**: Detailed feature comparisons
6. **Discount Codes**: Support for promotional pricing

### Technical Improvements
1. **Optimistic Updates**: UI updates before API confirmation
2. **Better Error Recovery**: Retry mechanisms for failed requests
3. **Offline Support**: Queue plan changes when offline
4. **Analytics Integration**: Track plan change conversion rates

## Maintenance

### Regular Tasks
- Monitor plan change success rates
- Update pricing information
- Review and update error messages
- Test Stripe webhook functionality

### Dependencies
- React 18+
- Stripe API (v2023-10-16)
- Firebase Auth & Realtime Database
- Lucide React (for icons)
- Tailwind CSS (for styling)

## Support and Troubleshooting

### Common Issues
1. **"Customer not found"**: User may not have completed initial signup
2. **"No active subscription"**: User may have cancelled or expired plan
3. **Price ID errors**: Check environment variable configuration
4. **Authentication failures**: Verify Firebase token validity

### Debug Information
- All plan changes logged in server console
- Firebase user data includes planChange history
- Stripe dashboard shows subscription modifications
- Client-side errors logged to browser console