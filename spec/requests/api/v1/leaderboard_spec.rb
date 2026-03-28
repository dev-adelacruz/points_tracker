# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Leaderboard" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host, monthly_coin_quota: 100_000) }
  let(:host2) { create(:user, :host, monthly_coin_quota: 80_000) }
  let(:host3) { create(:user, :host, monthly_coin_quota: 0) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  describe "#index" do
    path "/api/v1/leaderboard" do
      get "returns company-wide leaderboard for all active hosts" do
        tags "Leaderboard"
        produces "application/json"
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false
        parameter name: :page, in: :query, type: :integer, required: false
        parameter name: :per_page, in: :query, type: :integer, required: false

        response(200, "returns hosts ranked by total coins with pagination") do
          before do
            create(:coin_entry, session: session, user: host1, coins: 50_000)
            create(:coin_entry, session: session, user: host2, coins: 30_000)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data.first[:user_id]).to eq(host1.id)
            expect(data.first[:rank]).to eq(1)
            expect(data.first[:total_coins]).to eq(50_000)
            expect(data.first[:quota_progress]).to eq(50.0)
            expect(data.second[:rank]).to eq(2)
            expect(json_response[:meta][:total_count]).to be >= 2
          end
        end

        response(200, "flags current user's entry") do
          before do
            create(:coin_entry, session: session, user: host1, coins: 20_000)
            sign_in host1
          end

          run_test! do
            expect(response).to have_http_status :ok
            current = json_response[:data].find { |h| h[:user_id] == host1.id }
            expect(current[:is_current_user]).to be true
            others = json_response[:data].reject { |h| h[:user_id] == host1.id }
            others.each { |h| expect(h[:is_current_user]).to be false }
          end
        end

        response(200, "filters by date range") do
          let(:date_from) { Date.current.to_s }
          let(:date_to) { Date.current.to_s }
          let(:old_session) { create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date, session_slot: :slot_two) }

          before do
            create(:coin_entry, session: session, user: host1, coins: 10_000)
            create(:coin_entry, session: old_session, user: host2, coins: 50_000)
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            h1 = json_response[:data].find { |h| h[:user_id] == host1.id }
            h2 = json_response[:data].find { |h| h[:user_id] == host2.id }
            expect(h1[:total_coins]).to eq(10_000)
            expect(h2[:total_coins]).to eq(0)
          end
        end

        response(200, "returns accessible to emcee role") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
          end
        end

        response(401, "returns unauthorized for unauthenticated requests") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end
end
