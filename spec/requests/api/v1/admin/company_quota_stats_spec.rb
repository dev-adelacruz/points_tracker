# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Admin::CompanyQuotaStats" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host, monthly_coin_quota: 100_000) }
  let(:host2) { create(:user, :host, monthly_coin_quota: 80_000) }
  let(:host3) { create(:user, :host, monthly_coin_quota: 0) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before do
    SystemSetting.find_or_create_by!(key: "company_coin_target") { |s| s.value = "300000" }
  end

  describe "#index" do
    path "/api/v1/admin/company_quota_stats" do
      get "returns company-wide quota status for all active hosts" do
        tags "Admin::CompanyQuotaStats"
        produces "application/json"
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false
        parameter name: :sort, in: :query, type: :string, required: false, description: "asc or desc by quota_progress"

        response(200, "returns host quota stats with summary") do
          before do
            host3
            create(:coin_entry, session: session, user: host1, coins: 60_000)
            create(:coin_entry, session: session, user: host2, coins: 20_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            summary = json_response[:summary]
            expect(summary[:total_hosts]).to eq(3)
            expect(summary[:company_coin_target]).to eq(300_000)
            data = json_response[:data]
            expect(data.length).to eq(3)
            h1 = data.find { |h| h[:user_id] == host1.id }
            expect(h1[:total_coins]).to eq(60_000)
            expect(h1[:quota_progress]).to eq(60.0)
            expect(h1).to have_key(:paced_monthly_coins)
            expect(h1).to have_key(:on_track)
            expect(h1[:met_quota]).to eq(false)
            h3 = data.find { |h| h[:user_id] == host3.id }
            expect(h3[:on_track]).to be_nil
          end
        end

        response(200, "sorts by quota_progress ascending") do
          let(:sort) { "asc" }

          before do
            create(:coin_entry, session: session, user: host1, coins: 80_000)
            create(:coin_entry, session: session, user: host2, coins: 10_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            progresses = data.map { |h| h[:quota_progress] }
            expect(progresses).to eq(progresses.sort)
          end
        end

        response(200, "filters by date range") do
          let(:date_from) { Date.current.to_s }
          let(:date_to) { Date.current.to_s }
          let(:old_session) { create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date, session_slot: :slot_two) }

          before do
            create(:coin_entry, session: session, user: host1, coins: 10_000)
            create(:coin_entry, session: old_session, user: host1, coins: 5_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            h1 = json_response[:data].find { |h| h[:user_id] == host1.id }
            expect(h1[:total_coins]).to eq(10_000)
          end
        end

        response(200, "returns met_quota true when coins exceed quota") do
          before do
            create(:coin_entry, session: session, user: host1, coins: 100_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            h1 = json_response[:data].find { |h| h[:user_id] == host1.id }
            expect(h1[:met_quota]).to eq(true)
            expect(json_response[:summary][:met_quota_count]).to eq(1)
          end
        end

        response(403, "returns forbidden for non-admin") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
