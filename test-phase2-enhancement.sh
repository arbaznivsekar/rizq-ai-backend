#!/bin/bash

# Phase 2 Enhancement Testing Script
# Tests job selection on details page functionality

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 PHASE 2 ENHANCEMENT - TESTING GUIDE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will guide you through testing the new features:"
echo "  ✅ Job selection on Job Details page"
echo "  ✅ Floating action bar on Job Details page"
echo "  ✅ Selection persistence across pages"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to wait for user
wait_for_user() {
    read -p "Press Enter to continue to next test..."
    echo ""
}

# Function to print test header
print_test() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST $1: $2"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Check if backend is running
echo "📡 Checking if backend is running..."
if ! curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo ""
    echo "Please start the backend in another terminal:"
    echo "  cd /home/arbaz/projects/rizq-ai/rizq-ai-backend"
    echo "  npm run dev"
    echo ""
    exit 1
fi
echo "✅ Backend is running!"
echo ""

# Check if frontend is running
echo "📡 Checking if frontend is running..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Frontend is not running!"
    echo ""
    echo "Please start the frontend in another terminal:"
    echo "  cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend"
    echo "  npm run dev"
    echo ""
    exit 1
fi
echo "✅ Frontend is running!"
echo ""

# Start tests
echo "🚀 Starting manual tests..."
echo ""
wait_for_user

# TEST 1: Selection from Homepage
print_test "1" "Selection from Homepage → Details Page"
echo "📝 Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Select 2-3 jobs using checkboxes on homepage"
echo "  3. Note the floating action bar appears at bottom"
echo "  4. Click 'View Details' on one of the SELECTED jobs"
echo ""
echo "✅ Expected Result:"
echo "  - Details page shows checkbox is CHECKED"
echo "  - Floating action bar is visible with correct count"
echo "  - Blue ring around job header card"
echo ""
read -p "Did the test pass? (y/n): " test1
echo ""

if [ "$test1" != "y" ]; then
    echo "❌ Test 1 Failed - Please review implementation"
    exit 1
fi

# TEST 2: Selection on Details Page
print_test "2" "Selection on Job Details Page"
echo "📝 Steps:"
echo "  1. Navigate to homepage"
echo "  2. Clear any existing selections (click X on floating bar)"
echo "  3. Click 'View Details' on ANY job (don't select it first)"
echo "  4. Click the checkbox at the top of the details page"
echo ""
echo "✅ Expected Result:"
echo "  - Checkbox becomes checked"
echo "  - Floating action bar appears showing '1 job selected'"
echo "  - Blue ring appears around job header card"
echo "  - Can click 'Apply to Selected Jobs' button"
echo ""
read -p "Did the test pass? (y/n): " test2
echo ""

if [ "$test2" != "y" ]; then
    echo "❌ Test 2 Failed - Please review implementation"
    exit 1
fi

# TEST 3: Selection Persistence
print_test "3" "Selection Persistence Across Pages"
echo "📝 Steps:"
echo "  1. On the details page with job selected (from Test 2)"
echo "  2. Click 'Back to search' button"
echo "  3. Look for the job you selected on homepage"
echo ""
echo "✅ Expected Result:"
echo "  - Job card on homepage has blue ring (still selected)"
echo "  - Checkbox on homepage is checked"
echo "  - Floating action bar still shows '1 job selected'"
echo ""
read -p "Did the test pass? (y/n): " test3
echo ""

if [ "$test3" != "y" ]; then
    echo "❌ Test 3 Failed - Please review implementation"
    exit 1
fi

# TEST 4: Mixed Selection (Homepage + Details)
print_test "4" "Mixed Selection from Homepage and Details"
echo "📝 Steps:"
echo "  1. Select 2 jobs from homepage (using checkboxes)"
echo "  2. View details of a DIFFERENT job (not selected)"
echo "  3. Select it using checkbox on details page"
echo "  4. Click 'Apply to Selected Jobs' button"
echo ""
echo "✅ Expected Result:"
echo "  - Floating bar shows '3 jobs selected'"
echo "  - Modal displays all 3 jobs (2 from homepage + 1 from details)"
echo "  - Can successfully apply to all 3"
echo ""
read -p "Did the test pass? (y/n): " test4
echo ""

if [ "$test4" != "y" ]; then
    echo "❌ Test 4 Failed - Please review implementation"
    exit 1
fi

# TEST 5: Deselection on Details Page
print_test "5" "Deselection on Job Details Page"
echo "📝 Steps:"
echo "  1. Navigate to homepage"
echo "  2. Select 1 job using checkbox"
echo "  3. Click 'View Details' on that job"
echo "  4. Uncheck the checkbox on details page"
echo ""
echo "✅ Expected Result:"
echo "  - Checkbox becomes unchecked"
echo "  - Floating action bar disappears"
echo "  - Blue ring disappears from job header card"
echo "  - Going back to homepage shows job is no longer selected"
echo ""
read -p "Did the test pass? (y/n): " test5
echo ""

if [ "$test5" != "y" ]; then
    echo "❌ Test 5 Failed - Please review implementation"
    exit 1
fi

# TEST 6: Bulk Apply from Details Page
print_test "6" "Bulk Apply from Job Details Page"
echo "📝 Steps:"
echo "  1. Navigate to homepage"
echo "  2. Select 3-5 jobs"
echo "  3. Click 'View Details' on any job"
echo "  4. On details page, click 'Apply to Selected Jobs'"
echo "  5. Review modal and click 'Confirm & Apply to All'"
echo ""
echo "✅ Expected Result:"
echo "  - Modal opens showing all selected jobs"
echo "  - Application submits successfully"
echo "  - Success toast appears"
echo "  - All selections are cleared"
echo "  - Floating bar disappears"
echo ""
read -p "Did the test pass? (y/n): " test6
echo ""

if [ "$test6" != "y" ]; then
    echo "❌ Test 6 Failed - Please review implementation"
    exit 1
fi

# TEST 7: Clear Selection Button
print_test "7" "Clear Selection from Details Page"
echo "📝 Steps:"
echo "  1. Select multiple jobs from homepage"
echo "  2. Navigate to details page of any job"
echo "  3. Click the X button on floating action bar"
echo ""
echo "✅ Expected Result:"
echo "  - All jobs are deselected"
echo "  - Floating action bar disappears"
echo "  - Going back to homepage shows no jobs selected"
echo ""
read -p "Did the test pass? (y/n): " test7
echo ""

if [ "$test7" != "y" ]; then
    echo "❌ Test 7 Failed - Please review implementation"
    exit 1
fi

# All tests passed
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ALL TESTS PASSED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Job selection on details page - Working"
echo "✅ Floating action bar on details page - Working"
echo "✅ Selection persistence - Working"
echo "✅ Mixed selection (homepage + details) - Working"
echo "✅ Deselection on details page - Working"
echo "✅ Bulk apply from details page - Working"
echo "✅ Clear selection from details page - Working"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation: docs/PHASE_2_ENHANCEMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Phase 2 Enhancement is COMPLETE and READY!"
echo ""


